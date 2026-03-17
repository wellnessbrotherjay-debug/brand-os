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
  const [globalTimer, setGlobalTimer] = useState({
    timeLeft: 0,
    phase: 'prep' as SessionPhase,
    isActive: false,
    workTime: 45,
    restTime: 15,
    targetEndTime: null as Date | null,
  });

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

    // ✅ Added: Local storage session polling to ensure sync even without StorageEvents
    const interval = window.setInterval(() => {
      const latest = storage.getSession();
      if (latest) setSession(latest);
    }, 1000);

    return () => {
      unsubSetup?.();
      unsubPlan?.();
      unsubSession?.();
      window.clearInterval(interval);
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

    // Global timer subscription (READ-ONLY - don't run countdown here)
    const timerChannel = supabaseClient
      .channel('global-timer-tv')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'global_timer',
        filter: 'id=eq.active',
      }, (payload) => {
        const timerData = payload.new as any;
        console.log('🔥 Display TV: Global timer UPDATE received!', {
          phase: timerData.phase,
          timeLeft: timerData.time_left,
          target_end_time: timerData.target_end_time,
          is_active: timerData.is_active,
        });

        if (timerData && timerData.target_end_time) {
          // Calculate time left from target end time - this eliminates lag!
          const targetEndTime = new Date(timerData.target_end_time).getTime();
          const now = Date.now();
          const calculatedTimeLeft = Math.max(0, Math.ceil((targetEndTime - now) / 1000));

          console.log('🎨 Display TV: Phase switch to', timerData.phase, 'Time:', calculatedTimeLeft, 'Color:', timerData.phase === 'work' ? '#FF4D4D' : '#32CD32');

          setGlobalTimer({
            timeLeft: calculatedTimeLeft,
            phase: timerData.phase || 'work',
            isActive: true,
            workTime: timerData.work_time || 45,
            restTime: timerData.rest_time || 15,
            targetEndTime: new Date(timerData.target_end_time),
          });
        } else if (timerData) {
          // Fallback to old method if target_end_time not available
          console.log('Display TV: Using fallback for phase', timerData.phase);
          setGlobalTimer({
            timeLeft: timerData.time_left || 45,
            phase: timerData.phase || 'work',
            isActive: true,
            workTime: timerData.work_time || 45,
            restTime: timerData.rest_time || 15,
            targetEndTime: null,
          });
        }
      })
      .subscribe((status) => {
        console.log('Display TV: Subscription status:', status);
      });

    // Local countdown that calculates from target time
    const localInterval = setInterval(() => {
      setGlobalTimer(prev => {
        // Always run countdown if we have a valid target end time
        if (!prev.targetEndTime) return prev;

        // Calculate time left from target end time
        const targetEndTime = prev.targetEndTime.getTime();
        const now = Date.now();
        const diff = targetEndTime - now;

        let calculatedTimeLeft = Math.ceil(diff / 1000);

        // Ensure we show at least 1 second if timer is active and target is in future
        if (diff > 100 && calculatedTimeLeft <= 0) {
          calculatedTimeLeft = 1;
        } else if (diff <= 0) {
          calculatedTimeLeft = 0;
        }

        return {
          ...prev,
          timeLeft: calculatedTimeLeft,
        };
      });
    }, 500); // ✅ Increased from 100ms to 500ms to reduce iPad CPU load

    // Fetch initial timer state (READ-ONLY) - do this immediately
    const fetchTimer = async () => {
      console.log('Display TV: Fetching initial timer state...');
      const { data, error } = await supabaseClient
        .from('global_timer')
        .select('*')
        .eq('id', 'active')
        .single();

      console.log('Display TV: Fetched timer data:', data, 'Error:', error);

      if (data) {
        let calculatedTimeLeft = 45; // Default to 45 seconds
        let targetEndTime = null;
        let phase = data.phase || 'work';
        let isActive = true; // Always force active for display TV

        if (data.target_end_time) {
          // Use target end time for precise calculation
          targetEndTime = new Date(data.target_end_time);
          const now = Date.now();
          const diff = targetEndTime.getTime() - now;

          // Calculate time left, but ensure it's reasonable
          if (diff > 0) {
            calculatedTimeLeft = Math.ceil(diff / 1000);
            console.log('Display TV: Using target end time:', data.target_end_time, 'Calculated:', calculatedTimeLeft);
          } else {
            // Target is in the past, timer might be expired
            console.log('Display TV: Target end time is in the past, using default');
            calculatedTimeLeft = data.time_left || 45;
            // Set a new target end time
            targetEndTime = new Date(Date.now() + calculatedTimeLeft * 1000);
            await supabaseClient
              .from('global_timer')
              .update({ target_end_time: targetEndTime.toISOString() })
              .eq('id', 'active');
          }
        } else {
          // No target end time, calculate from time_left
          calculatedTimeLeft = data.time_left || 45;
          targetEndTime = new Date(Date.now() + calculatedTimeLeft * 1000);

          // Update the database with target end time for future sync
          await supabaseClient
            .from('global_timer')
            .update({
              target_end_time: targetEndTime.toISOString(),
              is_active: true,
            })
            .eq('id', 'active');
          console.log('Display TV: Set target end time for existing timer');
        }

        // Ensure we never show 00:00 when timer should be active
        if (calculatedTimeLeft <= 0) {
          console.log('Display TV: Calculated time <= 0 but timer is active, using default');
          calculatedTimeLeft = 45;
          targetEndTime = new Date(Date.now() + 45000);
          await supabaseClient
            .from('global_timer')
            .update({
              time_left: 45,
              target_end_time: targetEndTime.toISOString(),
            })
            .eq('id', 'active');
        }

        setGlobalTimer({
          timeLeft: calculatedTimeLeft,
          phase: phase,
          isActive: isActive, // Always true for display TV
          workTime: data.work_time || 45,
          restTime: data.rest_time || 15,
          targetEndTime: targetEndTime,
        });
        console.log('Display TV: Initial sync complete - timeLeft:', calculatedTimeLeft, 'phase:', phase);
      } else if (!error) {
        // No timer exists, create one (display-tv can create as backup)
        console.log('Display TV: No timer found, creating one...');
        const newTargetEndTime = new Date(Date.now() + 45000); // 45 seconds from now
        const { data: newData } = await supabaseClient
          .from('global_timer')
          .insert({
            id: 'active',
            time_left: 45,
            phase: 'work',
            is_active: true,
            work_time: 45,
            rest_time: 15,
            target_end_time: newTargetEndTime.toISOString(),
          })
          .select()
          .single();

        if (newData) {
          setGlobalTimer({
            timeLeft: 45,
            phase: 'work',
            isActive: true,
            workTime: 45,
            restTime: 15,
            targetEndTime: newTargetEndTime,
          });
          console.log('Display TV: Created new timer');
        }
      } else {
        console.log('Display TV: Error fetching timer:', error);
      }
    };

    // Fetch immediately
    fetchTimer();

    // Polling fallback - fetch timer every 1 second to ensure we never miss updates
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabaseClient
          .from('global_timer')
          .select('*')
          .eq('id', 'active')
          .single();

        if (data && data.target_end_time) {
          const targetEndTime = new Date(data.target_end_time);
          const now = Date.now();
          const diff = targetEndTime.getTime() - now;
          let calculatedTimeLeft = Math.ceil(diff / 1000);

          if (diff > 100 && calculatedTimeLeft <= 0) {
            calculatedTimeLeft = 1;
          } else if (diff <= 0) {
            calculatedTimeLeft = 0;
          }

          console.log('🔄 Display TV: Polling update - phase:', data.phase, 'timeLeft:', calculatedTimeLeft);

          setGlobalTimer({
            timeLeft: calculatedTimeLeft,
            phase: data.phase || 'work',
            isActive: true,
            workTime: data.work_time || 45,
            restTime: data.rest_time || 15,
            targetEndTime: targetEndTime,
          });
        }
      } catch (error) {
        console.error('Display TV: Polling error:', error);
      }
    }, 1000); // Poll every 1 second

    return () => {
      mounted = false;
      if (channel) supabaseClient.removeChannel(channel);
      if (timerChannel) supabaseClient.removeChannel(timerChannel);
      clearInterval(localInterval);
      clearInterval(pollInterval);
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
  // Always use global timer if it has valid data, otherwise fall back to session timer
  const hasValidGlobalTimer = globalTimer.timeLeft >= 0 && globalTimer.targetEndTime !== null;
  const currentPhase: SessionPhase = hasValidGlobalTimer ? globalTimer.phase : (session?.phase ?? "prep");
  const remainingTime = hasValidGlobalTimer ? globalTimer.timeLeft : (session?.remaining ?? setup?.workTime ?? 0);
  const currentRound = session?.round ?? 1;
  const totalRounds = setup?.rounds ?? 1;

  // Force global timer to be active if it has valid data
  useEffect(() => {
    if (hasValidGlobalTimer && !globalTimer.isActive) {
      setGlobalTimer(prev => ({ ...prev, isActive: true }));
    }
  }, [hasValidGlobalTimer, globalTimer.isActive]);

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
          <div className="border-t border-blue-400 pt-2 mt-2">
            <div className="font-bold mb-1">Global Timer:</div>
            <div>isActive: {globalTimer.isActive.toString()}</div>
            <div>timeLeft: {globalTimer.timeLeft}</div>
            <div>phase: {globalTimer.phase}</div>
            <div>targetEndTime: {globalTimer.targetEndTime ? globalTimer.targetEndTime.toISOString() : 'null'}</div>
            <div>hasValidGlobalTimer: {hasValidGlobalTimer.toString()}</div>
          </div>
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
            className="flex flex-col items-center gap-4 rounded-[24px] border-2 px-6 py-8 text-center"
            style={{
              borderColor: primaryBrand,
              backgroundColor: hexToRgba(primaryBrand, 0.12),
              boxShadow: `0 0 55px ${hexToRgba(primaryBrand, 0.25)}`,
            }}
          >
            <p className="text-xs uppercase tracking-[0.45em]" style={{ color: primaryBrand }}>
              Time Remaining
            </p>
            <p
              className="text-4xl font-black"
              style={{ color: primaryBrand, textShadow: `0 0 25px ${hexToRgba(primaryBrand, 0.35)}` }}
            >
              {remainingTime}s
            </p>
          </div>

          <div
            className="flex flex-col items-center gap-4 rounded-[24px] border-2 px-6 py-8 text-center"
            style={{
              borderColor: accentBrand,
              backgroundColor: hexToRgba(accentBrand, 0.12),
              boxShadow: `0 0 55px ${hexToRgba(accentBrand, 0.25)}`,
            }}
          >
            <p className="text-xs uppercase tracking-[0.45em]" style={{ color: accentBrand }}>
              Active Station
            </p>
            <p
              className="text-3xl font-black"
              style={{ color: accentBrand, textShadow: `0 0 25px ${hexToRgba(accentBrand, 0.35)}` }}
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
