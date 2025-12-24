"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Orbitron } from "next/font/google";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  storage,
  STORAGE_KEYS,
  type SessionPhase,
  type SessionState,
  type WorkoutPlan,
  type WorkoutSetup,
} from "@/lib/workout-engine/storage";
import { resolveExerciseMedia } from "@/lib/workout-engine/media";
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

const FALLBACK_VIDEO = "/videos/fallback.mp4";

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

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
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

export default function DisplayTvPage() {
  const router = useRouter();

  const [showDebug, setShowDebug] = useState(false);
  const [setup, setSetup] = useState<WorkoutSetup | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [workoutCountdown, setWorkoutCountdown] = useState(60 * 36);

  const { activeVenue } = useVenueContext();
  const { library: exerciseLibrary } = useExerciseMediaLibrary();

  const brandColors = useMemo(() => {
    return resolveBrandColors({ activeVenue, setup });
  }, [activeVenue, setup]);

  const { primary: primaryBrand, secondary: secondaryBrand, accent: accentBrand } = brandColors;

  useEffect(() => {
    const nextSetup = storage.getSetup();
    if (!nextSetup) {
      setError("Setup missing. Please configure stations first.");
      router.replace("/setup");
      return;
    }
    setSetup(nextSetup);
    setPlan(storage.getPlan());
    setSession(storage.getSession());
    setLastUpdated(new Date().toLocaleString());
  }, [router]);

  useEffect(() => {
    const handleSetupUpdate = (nextSetup: WorkoutSetup | null) => setSetup(nextSetup);
    const handlePlanUpdate = (nextPlan: WorkoutPlan | null) => {
      setPlan(nextPlan);
      setLastUpdated(new Date().toLocaleString());
    };
    const handleSessionUpdate = (nextSession: SessionState | null) => setSession(nextSession);

    const unsubSetup = storage.subscribe(STORAGE_KEYS.setup, handleSetupUpdate);
    const unsubPlan = storage.subscribe(STORAGE_KEYS.plan, handlePlanUpdate);
    const unsubSession = storage.subscribe(STORAGE_KEYS.session, handleSessionUpdate);

    return () => {
      unsubSetup?.();
      unsubPlan?.();
      unsubSession?.();
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWorkoutCountdown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!supabaseClient) return;

    let mounted = true;

    const fetchPlan = async () => {
      try {
        const { data, error: fetchError } = await supabaseClient
          .from("workouts")
          .select("data")
          .eq("id", "active")
          .single();

        if (fetchError) {
          console.error("Supabase plan fetch failed", fetchError);
          if (mounted) setError("Unable to fetch latest workout from Supabase.");
          return;
        }

        if (data?.data && mounted) {
          storage.savePlan(data.data);
          setPlan(data.data);
          setLastUpdated(new Date().toLocaleString());
          setError(null);
        }
      } catch (err) {
        console.error("Unexpected Supabase error", err);
        if (mounted) setError("Unexpected Supabase error. Showing local plan.");
      }
    };

    fetchPlan();

    const channel = supabaseClient
      .channel("tv-workouts")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "workouts" }, (payload) => {
        const nextPlan = payload.new?.data as WorkoutPlan | undefined;
        if (nextPlan) {
          storage.savePlan(nextPlan);
          setPlan(nextPlan);
          setLastUpdated(new Date().toLocaleString());
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
      setError("Setup missing. Please configure stations first.");
    } else if (!plan) {
      setError("No workout plan found. Use the builder to assign exercises.");
    } else if (!plan.exercises?.length) {
      setError("Workout plan has no exercises.");
    } else {
      setError(null);
    }
  }, [setup, plan]);

  const stations = plan?.exercises ?? [];
  const currentStationId = session?.stationId ?? stations[0]?.stationId ?? null;
  const currentExercise = useMemo(() => {
    if (!currentStationId) return null;
    return stations.find((station) => station.stationId === currentStationId) ?? null;
  }, [stations, currentStationId]);

  const currentMedia = resolveExerciseMedia(currentExercise, { library: exerciseLibrary });
  const currentPhase: SessionPhase = session?.phase ?? "prep";
  const remainingTime = session?.remaining ?? setup?.workTime ?? 0;
  const currentRound = session?.round ?? 1;
  const totalRounds = setup?.rounds ?? 1;

  const workoutName = plan?.goal ?? "Workout";
  const timingFormat = setup
    ? `${setup.workTime}s Work / ${setup.restTime}s Rest`
    : "Configure timing in setup";
  const facilityName = setup?.facilityName || "HOTEL FITNESS";

  const phaseColor = PHASE_COLOR[currentPhase];

  return (
    <main
      className={`${orbitron.variable} ${orbitron.className} relative flex min-h-screen w-screen items-center justify-center bg-black text-white`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#202020,transparent_55%)]" />

      {!showDebug && (
        <button
          className="absolute top-6 left-6 z-50 bg-blue-900 text-white border-2 border-blue-400 rounded-full shadow-lg px-3 py-2 text-xs"
          style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowDebug(true)}
        >
          🐞
        </button>
      )}

      {showDebug && (
        <div className="absolute top-6 left-6 z-50 bg-black text-white border-2 border-blue-400 rounded-lg shadow-lg p-4 text-xs max-w-xs space-y-2">
          <div className="flex w-full justify-between items-center">
            <strong>Debug Panel</strong>
            <button
              className="ml-2 px-2 py-1 bg-blue-900 text-white rounded-full border border-blue-400 text-xs"
              onClick={() => setShowDebug(false)}
            >
              ✕
            </button>
          </div>
          <div>Last Updated: {lastUpdated ?? "Never"}</div>
          <div>Error: {error ?? "None"}</div>
          <div>Phase: {currentPhase}</div>
          <div>Remaining: {remainingTime}s</div>
          <div>Round: {currentRound}</div>
          <div>Plan: {JSON.stringify(plan)}</div>
          <div>Session: {JSON.stringify(session)}</div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-10 lg:px-12 lg:py-12 flex flex-col gap-12">

        {/* Header Section */}
        <header className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs uppercase tracking-[0.55em] text-brand-secondary/90">
            {facilityName}
          </p>
          <h1 className="text-4xl font-extrabold uppercase md:text-5xl text-brand-primary">
            WARRIOR STATIONS
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.35em] text-brand-accent/70">
            <span>{timingFormat}</span>
            <span>•</span>
            <span>{workoutName}</span>
            <span>•</span>
            <span>Round {currentRound} of {totalRounds}</span>
          </div>
        </header>

        {/* Status Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          </div>

          <div
            className="flex flex-col items-center gap-4 rounded-[24px] border-2 px-6 py-8 text-center border-brand-primary bg-brand-primary/10 shadow-[0_0_55px_rgba(0,191,255,0.25)]"
          >
            <p className="text-xs uppercase tracking-[0.45em] text-brand-primary">
              Time Remaining
            </p>
            <p
              className="text-4xl font-black text-brand-primary drop-shadow-[0_0_25px_rgba(0,191,255,0.35)]"
            >
              {remainingTime}s
            </p>
          </div>

          <div
            className="flex flex-col items-center gap-4 rounded-[24px] border-2 px-6 py-8 text-center border-brand-accent bg-brand-accent/10 shadow-[0_0_55px_rgba(255,209,0,0.25)]"
          >
            <p className="text-xs uppercase tracking-[0.45em] text-brand-accent">
              Active Station
            </p>
            <p
              className="text-3xl font-black text-brand-accent drop-shadow-[0_0_25px_rgba(255,209,0,0.35)]"
            >
              {currentStationId ? `Station ${currentStationId}` : "TBD"}
            </p>
          </div>
        </div>

        {/* Station Lineup Section */}
        <div
          className="rounded-[24px] border border-white/10 bg-black/60 px-8 py-10 shadow-[0_0_45px_rgba(0,0,0,0.4)] backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-2xl font-bold uppercase tracking-[0.2em] text-brand-secondary"
            >
              STATION LINEUP
            </h2>
            <div
              className="text-sm uppercase tracking-[0.15em] font-bold text-brand-accent/70"
            >
              {stations.length} STATIONS ON DECK
            </div>
          </div>

          {/* Stations Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {stations.length > 0 ? (
              stations.map((station) => (
                <div
                  key={station.stationId}
                  className={`rounded-[20px] border-2 p-6 transition-all duration-300 hover:scale-105 ${station.stationId === currentStationId
                      ? "bg-brand-primary/15 border-brand-primary shadow-[0_0_35px_rgba(0,191,255,0.3)]"
                      : "bg-black/60 border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                    }`}
                >
                  <div className="text-center">
                    <div
                      className={`text-xl font-black mb-2 uppercase tracking-wider ${station.stationId === currentStationId
                          ? "text-brand-primary drop-shadow-[0_0_15px_rgba(0,191,255,0.4)]"
                          : "text-brand-accent drop-shadow-[0_0_15px_rgba(255,209,0,0.4)]"
                        }`}
                    >
                      STATION {station.stationId}
                    </div>
                    <div
                      className="text-xs uppercase tracking-[0.1em] font-bold mb-3 text-brand-secondary/80"
                    >
                      {setup?.stations.find((s) => s.id === station.stationId)?.equipment ?? "EQUIPMENT"}
                    </div>
                    <div
                      className="text-sm font-bold leading-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                    >
                      {station.name}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                className="col-span-full text-center p-12 border-2 rounded-[20px] border-brand-accent/40 bg-brand-accent/10 shadow-[0_0_40px_rgba(255,209,0,0.1)]"
              >
                <p className="text-xl font-bold text-brand-accent">No stations assigned yet</p>
                <p className="text-sm mt-2 text-brand-accent/70">Use the builder to assign exercises to stations.</p>
              </div>
            )}
          </div>
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
