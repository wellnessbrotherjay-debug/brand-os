"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Orbitron } from "next/font/google";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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

import { supabase as supabaseClient } from "@/lib/supabaseClient";

const FALLBACK_VIDEO = "/videos/fallback.mp4";

const PHASE_LABEL: Record<SessionPhase, string> = {
  prep: "Get Ready",
  work: "Work",
  rest: "Rest",
  change: "Station Change",
  complete: "Complete",
};

const PHASE_COLOR: Record<SessionPhase, string> = {
  prep: "#F1EDE5", // Beige
  work: "#FF4D4D", // Red
  rest: "#C8A871", // Gold
  change: "#C8A871", // Gold
  complete: "#C8A871", // Gold
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
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-xl font-bold">Loading...</div>
        </div>
      </div>
    }>
      <DisplayTvContent />
    </Suspense>
  );
}

function DisplayTvContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeOverride = searchParams?.get('mode') as 'studio-a' | 'studio-b' | null;

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
    setNumber: 1,
  });


  const toggleFullscreen = async () => {
    try {
      const doc = document as any;
      const elem = document.documentElement as any;

      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      setIsFullscreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const { activeVenue } = useVenueContext();
  const { library: exerciseLibrary } = useExerciseMediaLibrary();

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Hardcode brand colors to Beige and White - NO BLUE, NO YELLOW
  const brandColors = {
    primary: "#FFFFFF",   // White
    secondary: "#F1EDE5", // Beige
    accent: "#F1EDE5",    // Beige
  };

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
        const today = new Date().toISOString().split('T')[0];
        
        // Priority 1: Today's scheduled workout
        const { data: scheduledData, error: scheduledError } = await (supabaseClient
          .from("workouts") as any)
          .select("data")
          .eq("id", today)
          .single();

        if (scheduledData?.data && mounted) {
          console.log("📅 Daily workout found for", today);
          storage.savePlan(scheduledData.data);
          setPlan(scheduledData.data);
          setLastUpdated(new Date().toLocaleString());
          setError(null);
          return;
        }

        // Priority 2: Standard "active" workout
        const { data: activeData, error: activeError } = await (supabaseClient
          .from("workouts") as any)
          .select("data")
          .eq("id", "active")
          .single();

        if (activeError) {
          console.error("Supabase plan fetch failed", activeError);
          if (mounted) setError("Unable to fetch latest workout from Supabase.");
          return;
        }

        if (activeData?.data && mounted) {
          storage.savePlan(activeData.data);
          setPlan(activeData.data);
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
        const nextPlan = (payload.new as any)?.data as WorkoutPlan | undefined;
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
            workTime: timerData.work_time || (setup?.workTime ?? 45),
            restTime: timerData.rest_time || (setup?.restTime ?? 15),
            targetEndTime: new Date(timerData.target_end_time),
            setNumber: timerData.set_number || 1,
          });
        } else if (timerData) {
          // Fallback to old method if target_end_time not available
          console.log('Display TV: Using fallback for phase', timerData.phase);
          setGlobalTimer({
            timeLeft: timerData.time_left || 45,
            phase: timerData.phase || 'work',
            isActive: true,
            workTime: timerData.work_time || (setup?.workTime ?? 45),
            restTime: timerData.rest_time || (setup?.restTime ?? 15),
            targetEndTime: null,
            setNumber: timerData.set_number || 1,
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
      const { data, error } = await (supabaseClient
        .from('global_timer') as any)
        .select('*')
        .eq('id', 'active')
        .single();

      console.log('Display TV: Fetched timer data:', data, 'Error:', error);

      if (data) {
        let calculatedTimeLeft = 45; 
        let targetEndTime = null;
        let phase = data.phase || 'work';
        let isActive = true;

        if ((data as any).target_end_time) {
          targetEndTime = new Date((data as any).target_end_time);
          const now = Date.now();
          const diff = targetEndTime.getTime() - now;
          calculatedTimeLeft = Math.max(0, Math.ceil(diff / 1000));
        } else {
          calculatedTimeLeft = (data as any).time_left || 45;
        }

        setGlobalTimer({
          timeLeft: calculatedTimeLeft,
          phase: phase,
          isActive: isActive, 
          workTime: (data as any).work_time || (setup?.workTime ?? 45),
          restTime: (data as any).rest_time || (setup?.restTime ?? 15),
          targetEndTime: targetEndTime,
          setNumber: data.set_number || 1,
        });
        console.log('Display TV: Initial sync complete - timeLeft:', calculatedTimeLeft, 'phase:', phase);
      } else if (!error) {
        console.log('Display TV: No timer found, waiting for Master...');
      } else {
        console.log('Display TV: Error fetching timer:', error);
      }
    };

    // Fetch immediately
    fetchTimer();

    // Polling fallback - fetch timer every 1 second to ensure we never miss updates
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await (supabaseClient
          .from('global_timer') as any)
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
            workTime: data.work_time || (setup?.workTime ?? 45),
            restTime: data.rest_time || (setup?.restTime ?? 15),
            targetEndTime: targetEndTime,
            setNumber: data.set_number || 1,
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

  const studioMode = modeOverride || plan?.studioMode || setup?.mode || 'studio-a';

  const stationGroups = useMemo(() => {
    if (!plan?.exercises) return [];
    const groups: Record<number, any[]> = {};
    plan.exercises.forEach(ex => {
      if (!groups[ex.stationId]) groups[ex.stationId] = [];
      groups[ex.stationId].push(ex);
    });
    // Sort each group by part
    Object.values(groups).forEach(group => group.sort((a, b) => (a.part || 0) - (b.part || 0)));
    return Object.entries(groups).map(([id, exercises]) => ({
      stationId: Number(id),
      exercises
    })).sort((a, b) => a.stationId - b.stationId);
  }, [plan]);

  const currentStationId = session?.stationId ?? stationGroups[0]?.stationId ?? null;
  const currentExercises = useMemo(() => {
    if (!currentStationId) return [];
    return (stationGroups.find((g) => g.stationId === currentStationId)?.exercises ?? []) as any[];
  }, [stationGroups, currentStationId]);

  const exerciseLabel = useMemo(() => {
    if (currentExercises.length === 0) return "Ready";
    return currentExercises.map(ex => ex.name).join(" + ");
  }, [currentExercises]);

  const currentMedia = resolveExerciseMedia(currentExercises[0], { library: exerciseLibrary });
  // Always use global timer if it has valid data, otherwise fall back to session timer
  const hasValidGlobalTimer = globalTimer.timeLeft >= 0 && globalTimer.targetEndTime !== null;
  const currentPhase: SessionPhase = hasValidGlobalTimer ? globalTimer.phase : (session?.phase ?? "prep");
  const remainingTime = hasValidGlobalTimer ? globalTimer.timeLeft : (session?.remaining ?? setup?.workTime ?? 0);
  const currentRound = session?.round ?? 1;
  const totalRounds = setup?.rounds ?? 1;

  const setSummary = `SET ${globalTimer.setNumber} OF 4`;
  const timingFormat = `45s Work / 45s Rest`;

  const phaseColor = PHASE_COLOR[currentPhase];

  return (
    <main
      className={`${orbitron.variable} ${orbitron.className} relative flex min-h-screen w-screen items-center justify-center bg-black text-white`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#202020,transparent_55%)]" />

      {!showDebug && (
        <button
          className="absolute top-6 left-6 z-50 bg-black text-white border-2 border-white/20 rounded-full shadow-lg px-3 py-2 text-xs"
          style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowDebug(true)}
        >
          🐞
        </button>
      )}

      {/* Fullscreen Toggle Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleFullscreen}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-black/50 text-white border border-white/20 hover:bg-white/10 transition-all backdrop-blur-md"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          )}
        </button>
      </div>

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
          <div className="border-t border-white/20 pt-2 mt-2">
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
        <header className="flex flex-col items-center gap-3 text-center mb-4">
          <h1 className="text-5xl font-extrabold uppercase md:text-7xl tracking-[0.2em] text-[#F1EDE5]">
            AVRL
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-[0.4em] text-white font-bold">
            <span className="opacity-80">{timingFormat}</span>
            <span className="opacity-40">•</span>
            <span className="opacity-80">{setSummary}</span>
            <span className="opacity-40">•</span>
            <span className="opacity-80">Round {currentRound} of {totalRounds}</span>
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
              {PHASE_LABEL[currentPhase]} {currentPhase !== 'change' && currentPhase !== 'complete' && currentPhase !== 'prep' ? `(${globalTimer.setNumber}/4)` : ''}
            </p>
          </div>

          <div
            className="flex flex-col items-center gap-4 rounded-[24px] border-2 px-6 py-8 text-center"
            style={{
              borderColor: secondaryBrand,
              backgroundColor: hexToRgba(secondaryBrand, 0.12),
              boxShadow: `0 0 55px ${hexToRgba(secondaryBrand, 0.25)}`,
            }}
          >
            <p className="text-xs uppercase tracking-[0.45em]" style={{ color: secondaryBrand }}>
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
              borderColor: secondaryBrand,
              backgroundColor: hexToRgba(secondaryBrand, 0.12),
              boxShadow: `0 0 55px ${hexToRgba(secondaryBrand, 0.25)}`,
            }}
          >
            <p className="text-xs uppercase tracking-[0.45em]" style={{ color: secondaryBrand }}>
              Active Station
            </p>
            <p
              className="text-3xl font-black italic uppercase leading-none"
              style={{ color: primaryBrand, textShadow: `0 0 25px ${hexToRgba(primaryBrand, 0.35)}` }}
            >
              {currentStationId ? `Station ${currentStationId}` : "TBD"}
            </p>
            {studioMode === 'studio-b' && (
              <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1">
                {exerciseLabel}
              </p>
            )}
          </div>
        </div>

        {/* Station Lineup Section */}
        <div
          className="rounded-[24px] border border-white/10 bg-black/60 px-8 py-10 shadow-[0_0_45px_rgba(0,0,0,0.4)] backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-2xl font-bold uppercase tracking-[0.2em] text-[#F1EDE5]"
            >
              STATION LINEUP
            </h2>
            <div
              className="text-sm uppercase tracking-[0.15em] font-bold text-white/70"
            >
              {stationGroups.length} STATIONS ON DECK
            </div>
          </div>

          {/* Stations Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {stationGroups.length > 0 ? (
              stationGroups.map((group) => (
                <div
                  key={group.stationId}
                  className={`rounded-[20px] border-2 p-6 transition-all duration-300 hover:scale-105 ${group.stationId === currentStationId
                      ? "bg-white/10 border-[#F1EDE5] shadow-[0_0_35px_rgba(241,237,229,0.3)]"
                      : "bg-black/60 border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                    }`}
                >
                  <div className="text-center">
                    <div
                      className={`text-xl font-black mb-2 uppercase tracking-wider ${group.stationId === currentStationId
                          ? "text-[#F1EDE5]"
                          : "text-white/60"
                        }`}
                    >
                      STATION {group.stationId}
                    </div>
                    <div className="flex flex-col gap-1">
                      {group.exercises.map((ex, i) => (
                        <div
                          key={i}
                          className={`text-xs font-bold uppercase tracking-wide truncate ${group.stationId === currentStationId
                              ? "text-white"
                              : "text-white/40"
                            }`}
                        >
                          {studioMode === 'studio-b' ? `${i + 1}. ` : ""}{ex.name}
                        </div>
                      ))}
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
