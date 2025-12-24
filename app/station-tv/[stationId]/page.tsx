"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Orbitron } from "next/font/google";
import {
  storage,
  STORAGE_KEYS,
  type SessionPhase,
  type SessionState,
  type WorkoutPlan,
  type WorkoutSetup,
} from "@/lib/workout-engine/storage";
import {
  FALLBACK_EXERCISE_VIDEO,
  resolveExerciseMedia,
} from "@/lib/workout-engine/media";
import { getExerciseInstructions } from "@/lib/workout-engine/instructions";
import { resolveBrandColors } from "@/lib/workout-engine/brand-colors";
import { useExerciseMediaLibrary } from "@/lib/workout-engine/library-hooks";
import { useVenueContext } from "@/lib/venue-context";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

type StationTvRouteParams = { stationId: string };

const PHASE_LABEL: Record<SessionPhase, string> = {
  prep: "Get Ready",
  work: "Work",
  rest: "Rest",
  complete: "Complete",
};

const PHASE_COLOR: Record<SessionPhase, string> = {
  prep: "#00BFFF",
  work: "#FF4D4D",
  rest: "#32CD32",
  complete: "#FFD100",
};

const FALLBACK_VIDEO = FALLBACK_EXERCISE_VIDEO;

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) return `rgba(255,255,255,${alpha})`;
  const numeric = parseInt(sanitized, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function StationTvDisplayPage() {
  const router = useRouter();
  const params = useParams<StationTvRouteParams>();
  const stationId = Number(params?.stationId ?? NaN);

  const [setup, setSetup] = useState<WorkoutSetup | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<SessionPhase>("prep");
  const [currentRound, setCurrentRound] = useState(1);
  const [activeStation, setActiveStation] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const { activeVenue } = useVenueContext();
  const { library: exerciseLibrary } = useExerciseMediaLibrary();

  const brandColors = useMemo(
    () => resolveBrandColors({ activeVenue, setup }),
    [activeVenue, setup]
  );
  const { primary: primaryBrand, accent: accentBrand } = brandColors;

  useEffect(() => {
    if (Number.isNaN(stationId)) {
      router.replace("/builder");
      return;
    }

    const nextSetup = storage.getSetup();
    if (!nextSetup) {
      setError("Setup missing. Please configure your stations first.");
      router.replace("/setup");
      return;
    }

    setSetup(nextSetup);
    setPlan(storage.getPlan());
    const nextSession = storage.getSession();
    if (nextSession) {
      setSession(nextSession);
      setTimeLeft(nextSession.remaining);
      setCurrentPhase(nextSession.phase);
      setCurrentRound(nextSession.round);
      setActiveStation(nextSession.stationId);
    } else {
      setTimeLeft(nextSetup.workTime ?? 0);
    }
  }, [router, stationId]);

  useEffect(() => {
    const handleSetupUpdate = (nextSetup: WorkoutSetup | null) => setSetup(nextSetup);
    const handlePlanUpdate = (nextPlan: WorkoutPlan | null) => {
      setPlan(nextPlan);
      setLastSynced(new Date().toLocaleString());
    };
    const handleSessionUpdate = (nextSession: SessionState | null) => {
      setSession(nextSession);
      setTimeLeft(nextSession?.remaining ?? 0);
      setCurrentPhase(nextSession?.phase ?? "prep");
      setCurrentRound(nextSession?.round ?? 1);
      setActiveStation(nextSession?.stationId ?? null);
    };

    const unsubSetup = storage.subscribe(STORAGE_KEYS.setup, handleSetupUpdate);
    const unsubPlan = storage.subscribe(STORAGE_KEYS.plan, handlePlanUpdate);
    const unsubSession = storage.subscribe(STORAGE_KEYS.session, handleSessionUpdate);

    const interval = window.setInterval(() => {
      const latestSession = storage.getSession();
      if (!latestSession) return;
      setTimeLeft(latestSession.remaining);
      setCurrentPhase(latestSession.phase);
      setCurrentRound(latestSession.round);
      setActiveStation(latestSession.stationId);
    }, 1000);

    return () => {
      unsubSetup?.();
      unsubPlan?.();
      unsubSession?.();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!supabaseClient) return;

    let mounted = true;

    const fetchLatestPlan = async () => {
      try {
        const { data, error: fetchError } = await supabaseClient
          .from("workouts")
          .select("data")
          .eq("id", "active")
          .single();

        if (fetchError) {
          console.error("Failed to fetch workout plan", fetchError);
          if (mounted) setError("Unable to fetch latest plan from Supabase.");
          return;
        }

        if (data?.data && mounted) {
          storage.savePlan(data.data);
          setPlan(data.data);
          setLastSynced(new Date().toLocaleString());
          setError(null);
        }
      } catch (err) {
        console.error("Unexpected Supabase error", err);
        if (mounted) setError("Unexpected Supabase error. Using local plan.");
      }
    };

    fetchLatestPlan();

    const channel = supabaseClient
      .channel("station-tv-workouts")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "workouts" }, (payload) => {
        const nextPlan = payload.new?.data as WorkoutPlan | undefined;
        if (nextPlan) {
          storage.savePlan(nextPlan);
          setPlan(nextPlan);
          setLastSynced(new Date().toLocaleString());
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      if (channel) supabaseClient.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!setup) {
      setError("Setup missing. Please configure your stations first.");
    } else if (!plan) {
      setError("No workout plan found. Use the builder to assign exercises.");
    } else if (!plan.exercises?.length) {
      setError("Workout plan has no exercises.");
    } else {
      const assignedExercise = plan.exercises.find((exercise) => exercise.stationId === stationId);
      if (!assignedExercise) {
        setError(`No exercise assigned to Station ${stationId}.`);
      } else {
        setError(null);
      }
    }
  }, [setup, plan, stationId]);

  const currentExercise = useMemo(() => {
    if (!plan?.exercises?.length) return null;
    const assignment = plan.exercises.find((exercise) => exercise.stationId === stationId);
    return assignment ?? null;
  }, [plan, stationId]);

  const currentMedia = resolveExerciseMedia(currentExercise, { library: exerciseLibrary });
  const currentVideo = currentMedia?.video ?? FALLBACK_VIDEO;
  const instructions =
    currentExercise?.cues?.length
      ? currentExercise.cues
      : currentMedia?.cues?.length
        ? currentMedia.cues
        : getExerciseInstructions(currentExercise?.name) ?? [];
  const currentEquipment =
    currentExercise?.equipment ??
    (currentExercise && setup
      ? setup.stations.find((station) => station.id === currentExercise.stationId)?.equipment ?? null
      : currentMedia?.equipment ?? null);

  const nextExercise = useMemo(() => {
    if (!plan?.exercises?.length) return null;
    const assignments = plan.exercises;
    const currentIndex = assignments.findIndex((exercise) => exercise.stationId === stationId);
    if (currentIndex === -1) return null;
    const nextIndex = (currentIndex + 1) % assignments.length;
    return assignments[nextIndex];
  }, [plan, stationId]);

  const nextMedia = resolveExerciseMedia(nextExercise, { library: exerciseLibrary });

  const phaseColor = PHASE_COLOR[currentPhase] ?? primaryBrand;
  const phaseLabel = PHASE_LABEL[currentPhase]?.toUpperCase() ?? "GET READY";
  const remainingTime = Math.max(timeLeft, 0);
  const totalRounds = setup?.rounds ?? 1;
  const facilityName = setup?.facilityName || "RaceFit";
  const stationLabel = currentExercise ? `Station ${currentExercise.stationId}` : `Station ${stationId}`;
  const isActive = activeStation === stationId;
  let upcomingPhase: SessionPhase | null = null;
  if (currentPhase === "prep") {
    upcomingPhase = "work";
  } else if (currentPhase === "work") {
    upcomingPhase = "rest";
  } else if (currentPhase === "rest") {
    upcomingPhase = nextExercise ? "work" : "complete";
  }
  const nextPhaseLabel = upcomingPhase ? PHASE_LABEL[upcomingPhase]?.toUpperCase() ?? null : null;

  const backgroundStyle = {
    background:
      "radial-gradient(1200px 800px at 50% 20%, rgba(0,175,255,0.1), transparent), linear-gradient(180deg,#05060a,#0b1420)",
  } as const;

  return (
    <main
      className={`${orbitron.variable} relative min-h-screen w-screen overflow-hidden text-[#e8e8e8]`}
      style={backgroundStyle}
    >
      {!showDebug && (
        <button
          className="absolute left-6 top-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border bg-[#0b1420] text-sm"
          style={{
            borderColor: hexToRgba(primaryBrand, 0.65),
            boxShadow: `0 0 20px ${hexToRgba(primaryBrand, 0.45)}`,
            color: hexToRgba(primaryBrand, 0.9),
          }}
          onClick={() => setShowDebug(true)}
        >
          🐞
        </button>
      )}

      {showDebug && (
        <div
          className="absolute left-6 top-6 z-50 w-64 rounded-2xl border bg-[#050b12]/95 p-4 text-xs shadow-[0_0_24px_rgba(0,175,255,0.3)]"
          style={{
            borderColor: hexToRgba(primaryBrand, 0.4),
            boxShadow: `0 0 24px ${hexToRgba(primaryBrand, 0.3)}`,
            color: hexToRgba(primaryBrand, 0.85),
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <strong>Debug Panel</strong>
            <button
              className="rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide"
              style={{
                borderColor: hexToRgba(primaryBrand, 0.55),
                color: hexToRgba(primaryBrand, 0.9),
              }}
              onClick={() => setShowDebug(false)}
            >
              Close
            </button>
          </div>
          <div>Last Synced: {lastSynced ?? "Never"}</div>
          <div>Error: {error ?? "None"}</div>
          <div>Phase: {currentPhase}</div>
          <div>Remaining: {remainingTime}s</div>
          <div>Round: {currentRound}/{totalRounds}</div>
          <div>Active Station: {activeStation ?? "None"}</div>
        </div>
      )}

      <div className="relative z-10 flex min-h-screen flex-col p-6 lg:p-10">
        <header className="flex flex-col items-center justify-center text-center uppercase tracking-[0.12em]">
          <div className="mb-3 flex items-center gap-4 text-[clamp(14px,1.2vw,20px)] text-[#68dfff]">
            {setup?.logo ? (
              <img
                src={setup.logo}
                alt={facilityName}
                className="h-12 w-auto"
                style={{ filter: "drop-shadow(0 0 18px rgba(0,175,255,0.25))" }}
              />
            ) : (
              <span className="text-sm font-semibold tracking-[0.3em]" style={{ color: hexToRgba("#68dfff", 0.85) }}>
                RF
              </span>
            )}
            <span className="text-[clamp(18px,1.6vw,28px)] font-bold">{facilityName.toUpperCase()}</span>
          </div>
          <div
            className="text-[clamp(26px,3.2vw,60px)] font-black"
            style={{
              color: primaryBrand,
              textShadow: `0 0 24px ${hexToRgba(primaryBrand, 0.25)}`,
            }}
          >
            {stationLabel.toUpperCase()}
          </div>
          <div
            className="mt-3 text-[clamp(12px,1.1vw,16px)] tracking-[0.4em]"
            style={{ color: hexToRgba(accentBrand, 0.7) }}
          >
            {setup
              ? `${setup.workTime}s WORK · ${setup.restTime}s REST · ROUND ${currentRound}/${totalRounds}`
              : "CONFIGURE WORKOUT"}
          </div>
        </header>

        <div className="mt-10 grid flex-1 gap-8 lg:grid-cols-[2fr,1fr]">
          <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/40 shadow-[0_0_32px_rgba(0,0,0,0.45)]">
            {currentVideo ? (
              <video
                key={currentVideo}
                src={currentVideo}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-center text-lg opacity-70">
                No media available for this station.
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="pointer-events-none absolute bottom-6 left-6 right-6 rounded-[18px] border border-white/15 bg-black/40 px-6 py-4 backdrop-blur-md">
              <div className="flex flex-col gap-2 text-left">
                <div
                  className="text-[clamp(22px,2.2vw,38px)] font-bold uppercase tracking-[0.18em]"
                  style={{ color: primaryBrand }}
                >
                  {currentExercise?.name ?? "Assign Exercise"}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[clamp(11px,0.95vw,15px)] tracking-[0.28em] text-[#cbd5e1]">
                  {currentEquipment && <span>Equipment: {currentEquipment}</span>}
                  {currentMedia?.muscles?.length ? (
                    <span>Targets: {currentMedia.muscles.join(" · ")}</span>
                  ) : null}
                  {isActive ? (
                    <span className="text-[#00ffa2]">Active Now</span>
                  ) : (
                    <span style={{ color: hexToRgba("#ffffff", 0.5) }}>Waiting</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-6 rounded-[28px] border border-white/10 bg-black/50 p-8 shadow-[0_0_28px_rgba(0,0,0,0.35)]">
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-black/60 p-8 text-center shadow-[0_0_24px_rgba(0,175,255,0.22)]">
              <div
                className="text-[clamp(14px,1.2vw,18px)] uppercase tracking-[0.45em]"
                style={{ color: hexToRgba(phaseColor, 0.85) }}
              >
                {phaseLabel}
              </div>
              <div
                className="mt-4 text-[clamp(64px,7vw,120px)] font-black leading-none tracking-[0.08em]"
                style={{
                  color: phaseColor,
                  textShadow: `0 0 38px ${hexToRgba(phaseColor, 0.45)}`,
                }}
              >
                {formatTime(remainingTime)}
              </div>
              <div className="mt-4 text-[clamp(12px,1vw,16px)] uppercase tracking-[0.3em]" style={{ color: hexToRgba("#ffffff", 0.65) }}>
                Round {currentRound}/{totalRounds}
              </div>
              <div className="mt-2 text-[clamp(10px,0.85vw,14px)] uppercase tracking-[0.32em]" style={{ color: hexToRgba("#ffffff", 0.45) }}>
                Next: {nextPhaseLabel ?? "—"}
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-black/40 p-6">
              <div className="text-[clamp(14px,1.1vw,18px)] uppercase tracking-[0.4em]" style={{ color: hexToRgba(accentBrand, 0.85) }}>
                Form Checklist
              </div>
              {instructions.length ? (
                <ul className="space-y-3 text-[clamp(12px,0.95vw,15px)] tracking-[0.18em] text-[#d0d7e6]">
                  {instructions.slice(0, 5).map((instruction) => (
                    <li
                      key={instruction}
                      className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3"
                      style={{ backdropFilter: "blur(8px)" }}
                    >
                      {instruction}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-center text-sm tracking-[0.2em] text-white/70">
                  Add coaching tips for this movement.
                </div>
              )}
            </div>

            {nextExercise && (
              <div className="rounded-[24px] border border-white/10 bg-black/40 p-6">
                <div className="text-[clamp(14px,1.1vw,18px)] uppercase tracking-[0.4em]" style={{ color: hexToRgba("#ff3e3e", 0.85) }}>
                  Up Next
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <div className="text-[clamp(18px,1.6vw,28px)] font-semibold tracking-[0.2em] text-white">
                    {nextExercise.name}
                  </div>
                  <div className="text-[clamp(11px,0.9vw,14px)] uppercase tracking-[0.3em]" style={{ color: hexToRgba("#ffffff", 0.6) }}>
                    Station {nextExercise.stationId}
                  </div>
                  {nextMedia?.muscles?.length ? (
                    <div className="text-[clamp(10px,0.85vw,13px)] uppercase tracking-[0.28em]" style={{ color: hexToRgba("#ffffff", 0.45) }}>
                      Focus: {nextMedia.muscles.join(" · ")}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </aside>
        </div>

        {error && (
          <div className="mx-auto mt-8 max-w-xl rounded-[20px] border border-[#ff3e3e]/40 bg-[#ff3e3e]/10 px-6 py-4 text-center text-sm text-[#ff3e3e] shadow-[0_0_30px_rgba(255,62,62,0.2)]">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
