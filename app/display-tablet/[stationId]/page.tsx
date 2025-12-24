"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import { Orbitron } from "next/font/google";
import Image from "next/image";
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
import { useVenueContext } from "@/lib/venue-context";
import { resolveBrandColors } from "@/lib/workout-engine/brand-colors";
import { useExerciseMediaLibrary } from "@/lib/workout-engine/library-hooks";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

type TabletRouteParams = { stationId: string };

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

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) return `rgba(255,255,255,${alpha})`;
  const numeric = parseInt(sanitized, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function TabletStationPage() {
  const router = useRouter();
  const params = useParams<TabletRouteParams>();
  const stationId = Number(params?.stationId ?? NaN);

  const [setup, setSetup] = useState<WorkoutSetup | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<SessionPhase>("prep");
  const [currentRound, setCurrentRound] = useState(1);

  const { activeVenue } = useVenueContext();
  const { library: exerciseLibrary } = useExerciseMediaLibrary();

  const brandColors = useMemo(() => {
    return resolveBrandColors({ activeVenue, setup });
  }, [activeVenue, setup]);

  const { primary: primaryBrand, secondary: secondaryBrand, accent: accentBrand } = brandColors;
  const [activeStation, setActiveStation] = useState<number | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(stationId)) {
      router.replace("/builder");
    }
  }, [router, stationId]);

  useEffect(() => {
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
    }
  }, [router]);

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
      .channel("tablet-workouts")
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

  const currentExercise = useMemo(() => {
    if (!plan?.exercises?.length) return null;
    return plan.exercises.find((exercise) => exercise.stationId === stationId) ?? null;
  }, [plan, stationId]);

  const exerciseName =
    currentExercise?.name ?? (plan ? `No Exercise Assigned (Station ${stationId})` : "No Plan Loaded");
  const resolvedMedia = useMemo(
    () => resolveExerciseMedia(currentExercise, { library: exerciseLibrary }),
    [currentExercise, exerciseLibrary]
  );
  const resolvedEquipment = resolvedMedia?.equipment;
  const exerciseEquipment = useMemo(() => {
    if (currentExercise?.equipment) return currentExercise.equipment;
    if (resolvedEquipment) return resolvedEquipment;
    if (!setup) return "N/A";
    return setup.stations.find((station) => station.id === stationId)?.equipment ?? "N/A";
  }, [currentExercise, resolvedEquipment, setup, stationId]);
  const instructions =
    currentExercise?.cues?.length
      ? currentExercise.cues
      : resolvedMedia?.cues?.length
        ? resolvedMedia.cues
        : getExerciseInstructions(currentExercise?.name);
  const exerciseDescription = (instructions ?? []).join(" ");
  const videoSrc = resolvedMedia?.video || FALLBACK_VIDEO;

  useEffect(() => {
    if (!setup) {
      setError("Setup missing. Please configure your stations first.");
    } else if (!plan) {
      setError("No workout plan found. Use the builder to assign exercises.");
    } else if (!currentExercise) {
      setError(`No exercise assigned to Station ${stationId}.`);
    } else {
      setError(null);
    }
  }, [setup, plan, currentExercise, stationId]);

  const phaseColor = PHASE_COLOR[currentPhase];
  const facilityName = setup?.facilityName || "HOTEL FITNESS";

  return (
    <main 
      className={`${orbitron.variable} ${orbitron.className} relative flex min-h-screen w-screen items-center justify-center bg-black text-white`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#202020,transparent_55%)]" />

      {!showDebug && (
        <button
          className="fixed top-4 left-4 z-50 bg-blue-900 text-white border-2 border-blue-400 rounded-full shadow-lg px-3 py-2 text-xs"
          style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowDebug(true)}
        >
          🐞
        </button>
      )}

      {showDebug && (
        <div className="fixed top-4 left-4 z-50 bg-black text-white border-2 border-blue-400 rounded-lg shadow-lg p-3 text-xs max-w-xs flex flex-col gap-2">
          <div className="flex w-full justify-between items-center">
            <strong>Debug Panel</strong>
            <button
              className="ml-2 px-2 py-1 bg-blue-900 text-white rounded-full border border-blue-400 text-xs"
              onClick={() => setShowDebug(false)}
            >
              ✕
            </button>
          </div>
          <div>Station: {stationId}</div>
          <div>Last Synced: {lastSynced ?? "Never"}</div>
          <div>Error: {error ?? "None"}</div>
          <div>Phase: {currentPhase}</div>
          <div>Time Left: {timeLeft}s</div>
          <div>Active Station: {activeStation ?? "None"}</div>
          <div>Plan: {JSON.stringify(plan)}</div>
          <div>Session: {JSON.stringify(session)}</div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-10 lg:px-12 lg:py-12 flex flex-col gap-8">
        
        {/* Header */}
        <header className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs uppercase tracking-[0.55em]" style={{ color: hexToRgba(secondaryBrand, 0.9) }}>
            {facilityName}
          </p>
          <h1 className="text-3xl font-extrabold uppercase" style={{ color: primaryBrand }}>
            STATION {stationId}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.35em]" style={{ color: hexToRgba(accentBrand, 0.7) }}>
            <span>Equipment: {exerciseEquipment}</span>
            <span>•</span>
            <span>Round {currentRound} of {setup?.rounds ?? 1}</span>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          
          {/* Exercise Video/Info */}
          <div 
            className="relative flex flex-col items-center justify-center rounded-[24px] border-2 px-8 py-10 text-center"
            style={{
              borderColor: primaryBrand,
              backgroundColor: hexToRgba(primaryBrand, 0.12),
              boxShadow: `0 0 55px ${hexToRgba(primaryBrand, 0.25)}`,
            }}
          >
            <p className="text-sm uppercase tracking-[0.45em] mb-4" style={{ color: primaryBrand }}>
              Current Exercise
            </p>
            <h2 
              className="text-2xl font-black uppercase mb-6" 
              style={{ color: primaryBrand, textShadow: `0 0 25px ${hexToRgba(primaryBrand, 0.35)}` }}
            >
              {exerciseName}
            </h2>
            
            {/* Video Container */}
            <div 
              className="relative w-full max-w-md rounded-[20px] border-2 overflow-hidden mb-6"
              style={{
                borderColor: accentBrand,
                boxShadow: `0 0 35px ${hexToRgba(accentBrand, 0.3)}`
              }}
            >
              <video
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto aspect-video object-cover bg-black"
              />
            </div>

            {/* Exercise Description */}
            {exerciseDescription && (
              <div 
                className="rounded-[16px] border p-4 text-sm leading-relaxed"
                style={{
                  borderColor: hexToRgba(secondaryBrand, 0.3),
                  backgroundColor: hexToRgba(secondaryBrand, 0.05),
                  color: hexToRgba(secondaryBrand, 0.9)
                }}
              >
                {exerciseDescription}
              </div>
            )}
          </div>

          {/* Status Panel */}
          <aside className="flex flex-col gap-6">
            
            {/* Phase Display */}
            <div 
              className="flex flex-col items-center gap-4 rounded-[24px] border-2 px-6 py-8 text-center"
              style={{
                borderColor: phaseColor,
                backgroundColor: hexToRgba(phaseColor, 0.12),
                boxShadow: `0 0 55px ${hexToRgba(phaseColor, 0.25)}`,
              }}
            >
              <p className="text-xs uppercase tracking-[0.45em]" style={{ color: phaseColor }}>
                Current Phase
              </p>
              <p 
                className="text-3xl font-black uppercase" 
                style={{ color: phaseColor, textShadow: `0 0 25px ${hexToRgba(phaseColor, 0.35)}` }}
              >
                {PHASE_LABEL[currentPhase]}
              </p>
              <p 
                className="text-4xl font-black" 
                style={{ color: phaseColor, textShadow: `0 0 25px ${hexToRgba(phaseColor, 0.35)}` }}
              >
                {timeLeft}s
              </p>
            </div>

            {/* Progress Panel */}
            <div 
              className="rounded-[20px] border border-white/10 bg-black/60 px-6 py-6 shadow-[0_0_45px_rgba(0,0,0,0.4)] backdrop-blur-md"
            >
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.4em]" style={{ color: secondaryBrand }}>
                  Session Progress
                </p>
                
                <div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-black/50 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.35em]" style={{ color: hexToRgba(accentBrand, 0.7) }}>
                    Round
                  </span>
                  <span className="text-lg font-bold text-white">
                    {currentRound} / {setup?.rounds ?? 1}
                  </span>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      backgroundColor: primaryBrand,
                      width: `${Math.min(100, ((currentRound ?? 1) / Math.max(1, setup?.rounds ?? 1)) * 100)}%`,
                      boxShadow: `0 0 10px ${hexToRgba(primaryBrand, 0.6)}`
                    }}
                  />
                </div>
              </div>

              {lastSynced && (
                <div className="mt-4 text-xs uppercase tracking-[0.3em]" style={{ color: hexToRgba(accentBrand, 0.65) }}>
                  <p>Last Sync: {lastSynced}</p>
                </div>
              )}
            </div>
          </aside>
        </div>

        {error && (
          <div 
            className="text-sm text-center border-2 rounded-[20px] px-6 py-4"
            style={{
              borderColor: "#FF4D4D",
              backgroundColor: hexToRgba("#FF4D4D", 0.1),
              color: "#FF4D4D",
              boxShadow: '0 0 30px rgba(255, 77, 77, 0.15)'
            }}
          >
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
