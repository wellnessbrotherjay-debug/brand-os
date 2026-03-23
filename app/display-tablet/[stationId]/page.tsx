"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
} from "@/lib/workout-engine/media";
import { useVenueContext } from "@/lib/venue-context";
import { resolveBrandColors } from "@/lib/workout-engine/brand-colors";
import { useExerciseMediaLibrary } from "@/lib/workout-engine/library-hooks";
import CloudflarePlayer from "@/components/CloudflarePlayer";
import { supabase as supabaseClient } from "@/lib/supabaseClient";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
});

type TabletRouteParams = { stationId: string };

const PHASE_COLOR: Record<SessionPhase, string> = {
  prep: "#F1EDE5", // Beige
  work: "#FF4D4D", // Red
  rest: "#C8A871", // Gold
  change: "#C8A871", // Gold
  complete: "#C8A871", // Gold
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
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-xl font-bold">Loading...</div>
        </div>
      </div>
    }>
      <TabletStationContent />
    </Suspense>
  );
}

function TabletStationContent() {
  const router = useRouter();
  const params = useParams<TabletRouteParams>();
  const searchParams = useSearchParams();
  const modeOverride = searchParams?.get('mode') as 'studio-a' | 'studio-b' | null;
  const stationId = Number(params?.stationId ?? NaN);

  const [setup, setSetup] = useState<WorkoutSetup | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<SessionPhase>("prep");
  const [globalTimer, setGlobalTimer] = useState({
    timeLeft: 0,
    phase: 'prep' as SessionPhase,
    isActive: false,
    workTime: 45,
    restTime: 15,
    targetEndTime: null as Date | null,
    setNumber: 1,
    activeStationId: 1,
  });

  const { activeVenue } = useVenueContext();
  const { library: exerciseLibrary } = useExerciseMediaLibrary();

  const brandColors = useMemo(() => {
    return resolveBrandColors({ activeVenue, setup });
  }, [activeVenue, setup]);

  const { primary: primaryBrand, secondary: secondaryBrand } = brandColors;
  const [showDebug, setShowDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [localTime, setLocalTime] = useState("");

  useEffect(() => {
    const updateClock = () =>
      setLocalTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    updateClock();
    const clockInterval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(clockInterval);
  }, []);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement);
      setIsFullscreen(isFull);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let wakeLock: any = null;
    let isMounted = true;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isMounted) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.log("Wake Lock error or unsupported:", err);
      }
    };
    
    requestWakeLock();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMounted = false;
      if (wakeLock) {
        wakeLock.release().catch(console.log);
        wakeLock = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const doc = document as any;
      const elem = document.documentElement as any;

      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else {
          setIsFullscreen(true);
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else {
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
      setIsFullscreen(!isFullscreen);
    }
  };

  // Editable Layout System
  const [isEditMode, setIsEditMode] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState({
    videoFit: 'contain' as 'cover' | 'contain' | 'fill',
    videoScale: 100,
    videoPosition: { x: 50, y: 50 }, // percentage based
    blackBars: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
    locked: false
  });

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
    };

    const unsubSetup = storage.subscribe(STORAGE_KEYS.setup, handleSetupUpdate);
    const unsubPlan = storage.subscribe(STORAGE_KEYS.plan, handlePlanUpdate);
    const unsubSession = storage.subscribe(STORAGE_KEYS.session, handleSessionUpdate);

    return () => {
      unsubSetup?.();
      unsubPlan?.();
      unsubSession?.();
    };
  }, []);

  // Global Timer Sync
  useEffect(() => {
    if (!supabaseClient) return;

    const channel = supabaseClient
      .channel('global-timer')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'global_timer', filter: 'id=eq.active' }, (payload) => {
        const timerData = payload.new as any;
        if (timerData && timerData.target_end_time) {
          const targetEndTime = new Date(timerData.target_end_time).getTime();
          const now = Date.now();
          const calculatedTimeLeft = Math.max(0, Math.ceil((targetEndTime - now) / 1000));

          setGlobalTimer({
            timeLeft: calculatedTimeLeft,
            phase: timerData.phase || 'work',
            isActive: true,
            workTime: timerData.work_time || 45,
            restTime: timerData.rest_time || 15,
            targetEndTime: new Date(timerData.target_end_time),
            setNumber: timerData.set_number || 1,
            activeStationId: timerData.active_station_id || 1,
          });
          setTimeLeft(calculatedTimeLeft);
          setCurrentPhase(timerData.phase || 'work');
        }
      })
      .subscribe();

    const fetchTimer = async () => {
      const { data } = await supabaseClient
        .from('global_timer')
        .select('*')
        .eq('id', 'active')
        .single();

      if (data) {
        let targetEndTime = (data as any).target_end_time ? new Date((data as any).target_end_time) : null;
        let calculatedTimeLeft = 45;
        const now = Date.now();

        if (targetEndTime && targetEndTime.getTime() > now) {
          calculatedTimeLeft = Math.max(0, Math.ceil((targetEndTime.getTime() - now) / 1000));
        }

        setGlobalTimer({
          timeLeft: calculatedTimeLeft,
          phase: (data as any).phase || 'work',
          isActive: true,
          workTime: (data as any).work_time || 45,
          restTime: (data as any).rest_time || 15,
          targetEndTime: targetEndTime,
          setNumber: (data as any).set_number || 1,
          activeStationId: (data as any).active_station_id || 1,
        });
        setTimeLeft(calculatedTimeLeft);
        setCurrentPhase((data as any).phase || 'work');
      }
    };

    fetchTimer();

    const localInterval = setInterval(() => {
      setGlobalTimer(prev => {
        if (!prev.isActive || !prev.targetEndTime) return prev;
        const now = Date.now();
        const diff = prev.targetEndTime.getTime() - now;
        let calculatedTimeLeft = Math.max(0, Math.ceil(diff / 1000));
        
        setTimeLeft(calculatedTimeLeft);
        setCurrentPhase(prev.phase);
        return { ...prev, timeLeft: calculatedTimeLeft };
      });
    }, 200);

    return () => {
      if (channel) supabaseClient.removeChannel(channel);
      clearInterval(localInterval);
    };
  }, []);

  useEffect(() => {
    if (!supabaseClient) return;
    let mounted = true;

    const fetchLatestPlan = async () => {
      if (!supabaseClient) return;
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Try today's scheduled workout
        const { data: scheduledData } = await (supabaseClient
          .from("workouts") as any)
          .select("data")
          .eq("scheduled_date", today)
          .limit(1)
          .maybeSingle();

        if (scheduledData?.data && mounted) {
          storage.savePlan(scheduledData.data);
          setPlan(scheduledData.data);
          setLastSynced(`Scheduled: ${today}`);
          setError(null);
          return;
        }

        // 2. Fallback to manually set "active" workout
        const { data: activeData } = await (supabaseClient
          .from("workouts") as any)
          .select("data")
          .eq("id", "active")
          .maybeSingle();

        if (activeData?.data && mounted) {
          storage.savePlan(activeData.data);
          setPlan(activeData.data);
          setLastSynced(new Date().toLocaleString());
          setError(null);
        }
      } catch (err) {
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

  const currentExercises = useMemo(() => {
    if (!plan?.exercises?.length) return [];
    return plan.exercises
      .filter((exercise) => Number(exercise.stationId) === Number(stationId))
      .sort((a, b) => (a.part || 0) - (b.part || 0));
  }, [plan, stationId]);

  const studioMode = modeOverride || plan?.studioMode || setup?.mode || 'studio-a';

  const exerciseNames = useMemo(() => {
    if (currentExercises.length === 0) return plan ? `No Exercise Assigned (Station ${stationId})` : "No Plan Loaded";
    return currentExercises.map(ex => ex.name).join(" + ");
  }, [currentExercises, plan, stationId]);

  const resolvedVideoIds = useMemo(() => {
    return currentExercises.map(ex => ex.video || "cea8e05486e40fd74f7f1d5574d37c7b");
  }, [currentExercises]);

  const videoId1 = resolvedVideoIds[0];
  const videoId2 = resolvedVideoIds[1];

  useEffect(() => {
    if (!setup) {
      setError("Setup missing. Please configure your stations first.");
    } else if (!plan) {
      setError("No workout plan found. Use the builder to assign exercises.");
    } else if (currentExercises.length === 0) {
      setError(`No exercise assigned to Station ${stationId}.`);
    } else {
      setError(null);
    }
  }, [setup, plan, currentExercises, stationId]);

  const displayTime = globalTimer.isActive ? globalTimer.timeLeft : timeLeft;
  const displayPhase = globalTimer.isActive ? globalTimer.phase : currentPhase;
  const displayPhaseColor = PHASE_COLOR[displayPhase];

  return (
    <main
      className={`${orbitron.variable} ${orbitron.className} relative h-screen w-screen overflow-hidden bg-black text-white`}
    >
      <div className={`absolute inset-0 bg-black flex ${studioMode === 'studio-b' ? 'flex-row' : ''}`}>
        <div className={`relative ${studioMode === 'studio-b' ? 'w-1/2 h-full border-r border-white/20' : 'h-full w-full'}`}>
          <CloudflarePlayer
            key={videoId1}
            videoId={videoId1}
            playing={true}
            loop={true}
            muted={true}
            controls={false}
          />
          {studioMode === 'studio-b' && (
            <div className="absolute top-2 left-2 z-10 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#C8A871]">Exercise 1</p>
              <p className="text-xs font-bold text-white truncate max-w-[150px]">{currentExercises[0]?.name}</p>
            </div>
          )}
        </div>
        {studioMode === 'studio-b' && (
          <div className="relative w-1/2 h-full">
            <CloudflarePlayer
              key={videoId2}
              videoId={videoId2}
              playing={true}
              loop={true}
              muted={true}
              controls={false}
            />
            <div className="absolute top-2 left-2 z-10 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#C8A871]">Exercise 2</p>
              <p className="text-xs font-bold text-white truncate max-w-[150px]">{currentExercises[1]?.name}</p>
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-0 left-0 right-0 h-32 bg-[#F1EDE5] z-30 flex items-center justify-between px-10 shadow-lg">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-[#F1EDE5]">AVLR</h1>
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#121112]">STATION {stationId}</p>
        </div>

        <div className="text-center w-full max-w-xl">
          <h2 className={`${studioMode === 'studio-b' ? 'text-xl' : 'text-3xl md:text-5xl'} font-black uppercase tracking-tight text-[#121112] leading-none italic`}>
            {studioMode === 'studio-b' ? 'Studio B Circuit' : exerciseNames}
          </h2>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-4">
            {localTime && (
              <span className="text-xl font-black tabular-nums tracking-widest text-[#121112] opacity-60">
                {localTime}
              </span>
            )}
            <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md rounded-full px-4 py-2 border border-[#C8A871]/30">
              <div
                className="w-3 h-3 rounded-full animate-pulse shadow-[0_0_8px_currentColor]"
                style={{ backgroundColor: displayPhaseColor === PHASE_COLOR.work ? "#C8A871" : displayPhaseColor, color: displayPhaseColor === PHASE_COLOR.work ? "#C8A871" : displayPhaseColor }}
              />
              <span className="text-2xl font-black tabular-nums tracking-tighter text-[#121112]">
                {displayTime}<span className="text-[10px] ml-0.5 opacity-60 italic">s</span>
              </span>
            </div>
          </div>
          <p className="text-[9px] uppercase tracking-[0.5em] font-black mr-2 text-[#C8A871]">
            {displayPhase === 'change' ? 'STATION CHANGE' : displayPhase} {displayPhase !== 'change' && displayPhase !== 'prep' && displayPhase !== 'complete' ? `(SET ${globalTimer.setNumber}/${setup?.rounds ?? 4})` : ''}
          </p>
        </div>
      </div>

      <div className="absolute top-32 left-0 right-0 h-24 bg-gradient-to-b from-[#F1EDE5]/40 to-transparent pointer-events-none z-20" />

      <div className="absolute top-[128px] left-0 w-full h-1 bg-[#121112]/10 z-50">
        <div
          className="h-full transition-all duration-1000 ease-linear"
          style={{
            backgroundColor: displayPhaseColor === PHASE_COLOR.work ? "#C8A871" : displayPhaseColor,
            width: `${Math.min(100, (displayTime / Math.max(1, (displayPhase === 'work' ? (globalTimer.workTime || setup?.workTime) : (globalTimer.restTime || setup?.restTime)) ?? 45)) * 100)}%`
          }}
        />
      </div>

      <div className="absolute bottom-10 left-10 z-20">
        <p className="text-[11px] uppercase tracking-[0.8em] font-black text-white/80 drop-shadow-md">AVLR</p>
      </div>

      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-red-900/90 backdrop-blur-md border border-red-500/50 text-xs uppercase tracking-widest text-white shadow-2xl">{error}</div>
      )}

      {videoError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-orange-900/90 backdrop-blur-md border border-orange-500/50 text-xs uppercase tracking-widest text-white shadow-2xl max-w-md text-center">{videoError}</div>
      )}

      {!showDebug && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-4">
          <button onClick={toggleFullscreen} className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-black/50 text-white border border-white/20 hover:bg-white/20">
            {isFullscreen ? '⤓' : '⤢'}
          </button>
          <button
            onClick={() => !layoutConfig.locked && setIsEditMode(!isEditMode)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isEditMode ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.5)]' : 'bg-black/50 text-white border border-white/20 hover:bg-white/20'} ${layoutConfig.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isEditMode ? '✓' : '⚙'}
          </button>
        </div>
      )}

      <div className="absolute top-0 right-0 w-20 h-20 z-50 cursor-pointer" onClick={() => setShowDebug(true)} />

      {showDebug && !isFullscreen && (
        <div className="fixed top-20 right-6 z-50 bg-black/99 text-white border border-white/20 rounded-2xl shadow-2xl p-6 text-[10px] font-mono max-w-xs backdrop-blur-xl">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2"><strong>SYSTEM DEBUG</strong><button onClick={() => setShowDebug(false)}>✕</button></div>
          <div className="space-y-1 opacity-80">
            <div>SYNC: {lastSynced || "WAITING"}</div>
            <div>STATION: {stationId}</div>
            <div>PHASE: {displayPhase}</div>
            <div>TIME: {displayTime}s</div>
          </div>
        </div>
      )}

      {isEditMode && !isFullscreen && (
        <div className="fixed top-20 left-6 z-50 bg-black/95 text-white border border-white/20 rounded-2xl shadow-2xl p-6 text-xs backdrop-blur-xl max-w-sm">
          <strong className="text-sm block mb-4 border-b border-white/10 pb-2">LAYOUT EDITOR</strong>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider opacity-60 mb-2">Video Fit Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(['cover', 'contain', 'fill'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => !layoutConfig.locked && setLayoutConfig(prev => ({ ...prev, videoFit: mode }))}
                    className={`px-3 py-2 rounded-lg text-[10px] uppercase tracking-wide transition-all ${layoutConfig.videoFit === mode ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
