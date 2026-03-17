"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
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
import { useVenueContext } from "@/lib/venue-context";
import { resolveBrandColors } from "@/lib/workout-engine/brand-colors";
import { useExerciseMediaLibrary } from "@/lib/workout-engine/library-hooks";
import CloudflarePlayer from "@/components/CloudflarePlayer";

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

const PHASE_COLOR: Record<SessionPhase, string> = {
  prep: "#00BFFF", // Deep Sky Blue
  work: "#FF4D4D", // Red
  rest: "#32CD32", // Lime Green
  complete: "#FFD100", // Gold
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
  const videoRef = useRef<HTMLVideoElement>(null);

  const brandColors = useMemo(() => {
    return resolveBrandColors({ activeVenue, setup });
  }, [activeVenue, setup]);

  const { primary: primaryBrand, secondary: secondaryBrand } = brandColors;
  const [showDebug, setShowDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Editable Layout System
  const [isEditMode, setIsEditMode] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState({
    videoFit: 'cover' as 'cover' | 'contain' | 'fill',
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

    const interval = window.setInterval(() => {
      const latestSession = storage.getSession();
      if (!latestSession) return;
      setTimeLeft(latestSession.remaining);
      setCurrentPhase(latestSession.phase);
    }, 1000);

    return () => {
      unsubSetup?.();
      unsubPlan?.();
      unsubSession?.();
      window.clearInterval(interval);
    };
  }, []);

  // Global Timer Sync
  useEffect(() => {
    if (!supabaseClient) return;

    // Subscribe to global timer changes
    const channel = supabaseClient
      .channel('global-timer')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'global_timer', filter: 'id=eq.active' }, (payload) => {
        const timerData = payload.new as any;
        console.log('Timer update received:', timerData);
        if (timerData && timerData.target_end_time) {
          // Calculate time left from target end time
          const targetEndTime = new Date(timerData.target_end_time).getTime();
          const now = Date.now();
          const calculatedTimeLeft = Math.max(0, Math.ceil((targetEndTime - now) / 1000));

          setGlobalTimer({
            timeLeft: calculatedTimeLeft,
            phase: timerData.phase || 'work',
            isActive: true, // Force active - tablet is master controller
            workTime: timerData.work_time || 45,
            restTime: timerData.rest_time || 15,
            targetEndTime: new Date(timerData.target_end_time),
          });
          setTimeLeft(calculatedTimeLeft);
          setCurrentPhase(timerData.phase || 'work');
        } else if (timerData) {
          // Fallback if target_end_time not available yet
          setGlobalTimer({
            timeLeft: timerData.time_left || 45,
            phase: timerData.phase || 'work',
            isActive: true, // Force active - tablet is master controller
            workTime: timerData.work_time || 45,
            restTime: timerData.rest_time || 15,
            targetEndTime: null,
          });
          setTimeLeft(timerData.time_left || 45);
          setCurrentPhase(timerData.phase || 'work');
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Fetch initial timer state and activate if needed
    const fetchTimer = async () => {
      const { data, error } = await supabaseClient
        .from('global_timer')
        .select('*')
        .eq('id', 'active')
        .single();

      console.log('Fetched timer data:', data, 'Error:', error);

      if (data) {
        // If timer exists but not active, activate it
        if (!data.is_active) {
          console.log('Activating timer...');
          const targetEndTime = new Date(Date.now() + 45000); // 45 seconds from now
          await supabaseClient
            .from('global_timer')
            .update({
              is_active: true,
              target_end_time: targetEndTime.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', 'active');
        }

        // Calculate time left from target end time
        let calculatedTimeLeft = 45;
        if (data.target_end_time) {
          const targetEndTime = new Date(data.target_end_time).getTime();
          const now = Date.now();
          calculatedTimeLeft = Math.max(0, Math.ceil((targetEndTime - now) / 1000));
        } else {
          // Set target end time if missing
          calculatedTimeLeft = data.time_left || 45;
          const targetEndTime = new Date(Date.now() + calculatedTimeLeft * 1000);
          await supabaseClient
            .from('global_timer')
            .update({ target_end_time: targetEndTime.toISOString() })
            .eq('id', 'active');
        }

        setGlobalTimer({
          timeLeft: calculatedTimeLeft,
          phase: data.phase || 'work',
          isActive: true,
          workTime: data.work_time || 45,
          restTime: data.rest_time || 15,
          targetEndTime: data.target_end_time ? new Date(data.target_end_time) : null,
        });
        setTimeLeft(calculatedTimeLeft);
        setCurrentPhase(data.phase || 'work');
      } else if (!error) {
        // Timer doesn't exist, create it
        console.log('Creating new timer...');
        const targetEndTime = new Date(Date.now() + 45000); // 45 seconds from now
        const { data: newData } = await supabaseClient
          .from('global_timer')
          .insert({
            id: 'active',
            time_left: 45,
            phase: 'work',
            is_active: true,
            work_time: 45,
            rest_time: 15,
            target_end_time: targetEndTime.toISOString(),
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
            targetEndTime: targetEndTime,
          });
          setTimeLeft(45);
          setCurrentPhase('work');
        }
      }
    };

    fetchTimer();

    // Local countdown that calculates from target time (MASTER - controls phase switching)
    const localInterval = setInterval(() => {
      setGlobalTimer(prev => {
        if (!prev.isActive || !prev.targetEndTime) return prev;

        // Calculate time left from target end time - this eliminates sync drift!
        const targetEndTime = prev.targetEndTime.getTime();
        const now = Date.now();
        let calculatedTimeLeft = Math.max(0, Math.ceil((targetEndTime - now) / 1000));

        // Prevent showing 0 if timer should be active and time > 0
        if (calculatedTimeLeft === 0 && (targetEndTime - now) > 1000) {
          calculatedTimeLeft = prev.timeLeft || 1;
        }

        setTimeLeft(calculatedTimeLeft);

        // Detect when we've reached the end of current phase
        if (calculatedTimeLeft <= 0 && (targetEndTime - now) <= 1000) {
          // Timer reached 0, switch phases automatically
          const nextPhase = prev.phase === 'work' ? 'rest' : 'work';
          const nextTime = nextPhase === 'work' ? prev.workTime : prev.restTime;
          const newTargetEndTime = new Date(Date.now() + nextTime * 1000);

          console.log('🚨 TABLET Phase switch:', prev.phase, '->', nextPhase, 'Time:', nextTime, 'Target:', newTargetEndTime.toISOString());

          // Update Supabase with new phase and target time - all other devices will follow
          supabaseClient
            .from('global_timer')
            .update({
              phase: nextPhase,
              target_end_time: newTargetEndTime.toISOString(),
              time_left: nextTime,
              updated_at: new Date().toISOString(),
            })
            .eq('id', 'active')
            .then(({ error }) => {
              if (error) {
                console.error('❌ TABLET Failed to update Supabase:', error);
              } else {
                console.log('✅ TABLET Successfully updated Supabase - other displays should switch now');
              }
            });

          // Update local state immediately for smooth UI
          setTimeLeft(nextTime);
          setCurrentPhase(nextPhase);

          return {
            ...prev,
            timeLeft: nextTime,
            phase: nextPhase,
            targetEndTime: newTargetEndTime,
          };
        }

        return {
          ...prev,
          timeLeft: calculatedTimeLeft,
        };
      });
    }, 100);

    return () => {
      if (channel) supabaseClient.removeChannel(channel);
      clearInterval(localInterval);
    };
  }, [supabaseClient]);

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

  const facilityName = setup?.facilityName || "HOTEL FITNESS";

  // Display global timer if active, otherwise fall back to session timer
  const displayTime = globalTimer.isActive ? globalTimer.timeLeft : timeLeft;
  const displayPhase = globalTimer.isActive ? globalTimer.phase : currentPhase;
  const displayPhaseColor = PHASE_COLOR[displayPhase];

  // Control video playback based on timer phase
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // iOS video loading fix
    const loadVideo = () => {
      if (video.readyState < 1) {
        try {
          video.load();
        } catch (err) {
          console.log('Video load failed:', err);
        }
      }
    };

    if (globalTimer.isActive) {
      if (globalTimer.phase === 'work') {
        // Play video during work phase
        loadVideo();
        video.play().catch((err: Error) => {
          console.log('Video autoplay failed:', err);
          // iOS autoplay failed - try with user interaction hint
          if (err.name === 'NotAllowedError') {
            console.log('iOS autoplay blocked - waiting for user interaction');
          }
        });
      } else if (globalTimer.phase === 'rest') {
        // Pause video during rest phase
        video.pause();
      }
    }
  }, [globalTimer.isActive, globalTimer.phase]);

  return (
    <main
      className={`${orbitron.variable} ${orbitron.className} relative h-screen w-screen overflow-hidden`}
    >
      {/* FULLSCREEN VIDEO BACKGROUND */}
      <div className="absolute inset-0 bg-black">
        {videoSrc.startsWith('http') || videoSrc.startsWith('/') ? (
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            // iOS-specific attributes for better streaming
            webkit-playsinline="true"
            x-webkit-airplay="allow"
            x5-video-player-type="h5"
            x5-video-player-fullscreen="false"
            // Preload for faster startup
            preload="auto"
            // Poster for fallback
            poster={videoSrc.includes('cloudflare') ? undefined : videoSrc.replace(/\.(mp4|webm|mov)$/i, '.jpg')}
            className="absolute inset-0 w-full h-full transition-all duration-200"
            style={{
              objectFit: layoutConfig.videoFit,
              transform: `scale(${layoutConfig.videoScale / 100}) translate(${(layoutConfig.videoPosition.x - 50) * -0.5}%, ${(layoutConfig.videoPosition.y - 50) * -0.5}%)`,
              transformOrigin: 'center center',
            }}
            onLoadedMetadata={() => {
              console.log('✅ Video loaded successfully');
            }}
            onError={(e) => {
              console.error('❌ Video error:', e);
              setVideoError(`Video load failed: ${videoSrc}`);
            }}
            onCanPlay={() => {
              console.log('✅ Video can play');
            }}
          />
        ) : (
          <CloudflarePlayer
            videoId={videoSrc}
            autoPlay={true}
            controls={false}
            className="absolute inset-0 w-full h-full"
          />
        )}
      </div>

      {/* Dark Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      {/* Optional Black Bars for Design */}
      {layoutConfig.blackBars.top > 0 && (
        <div className="absolute top-0 left-0 right-0 bg-black z-20" style={{ height: `${layoutConfig.blackBars.top}%` }} />
      )}
      {layoutConfig.blackBars.bottom > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-black z-20" style={{ height: `${layoutConfig.blackBars.bottom}%` }} />
      )}
      {layoutConfig.blackBars.left > 0 && (
        <div className="absolute left-0 top-0 bottom-0 bg-black z-20" style={{ width: `${layoutConfig.blackBars.left}%` }} />
      )}
      {layoutConfig.blackBars.right > 0 && (
        <div className="absolute right-0 top-0 bottom-0 bg-black z-20" style={{ width: `${layoutConfig.blackBars.right}%` }} />
      )}

      {/* Subtle Progress Bar at the very top */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5 z-50">
        <div
          className="h-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(255,255,255,0.3)]"
          style={{
            backgroundColor: displayPhaseColor,
            width: `${Math.min(100, (displayTime / Math.max(1, (displayPhase === 'work' ? (globalTimer.workTime || setup?.workTime) : (globalTimer.restTime || setup?.restTime)) ?? 45)) * 100)}%`
          }}
        />
      </div>

      {/* Floating UI Overlay */}
      <div className="relative z-10 h-full flex flex-col justify-between py-8 px-6">

        {/* Top Bar */}
        <div className="flex items-start justify-between">
          {/* Station - Top Left */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black uppercase tracking-[0.15em]" style={{ color: primaryBrand }}>
              STATION {stationId}
            </h1>
            <div
              className="h-[1px] w-16 opacity-30"
              style={{ backgroundColor: primaryBrand }}
            />
          </div>

          {/* Exercise Name - Top Center */}
          <div className="absolute left-1/2 top-8 -translate-x-1/2 text-center">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] leading-none">
              {exerciseName}
            </h2>
          </div>
        </div>
      </div>

      {/* Logo - Bottom Center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <p className="text-[10px] uppercase tracking-[0.6em] font-bold opacity-70">
          {facilityName}
        </p>
      </div>

      {/* Mini Timer - Top Right */}
      <div className="fixed top-6 right-6 z-40">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/20 shadow-2xl">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: displayPhaseColor }}
          />
          <span className="text-sm font-bold tabular-nums tracking-tight" style={{ color: displayPhaseColor }}>
            {displayTime}s
          </span>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-red-900/90 backdrop-blur-md border border-red-500/50 text-xs uppercase tracking-widest text-white shadow-2xl">
          {error}
        </div>
      )}

      {videoError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-orange-900/90 backdrop-blur-md border border-orange-500/50 text-xs uppercase tracking-widest text-white shadow-2xl max-w-md text-center">
          Video Error: {videoError}
        </div>
      )}

      {/* Edit Mode Toggle (Bottom Right) */}
      {!showDebug && (
        <>
          <div
            className="fixed bottom-6 right-6 z-40 cursor-pointer group"
            onClick={() => !layoutConfig.locked && setIsEditMode(!isEditMode)}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isEditMode
                ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.5)]'
                : 'bg-black/50 text-white border border-white/20 group-hover:bg-white/20'
            } ${layoutConfig.locked ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isEditMode ? '✓' : '⚙'}
            </div>
          </div>

          {/* Debug Trigger (Transparent top right) */}
          <div
            className="absolute top-0 right-0 w-20 h-20 z-50 cursor-pointer"
            onClick={() => setShowDebug(true)}
          />
        </>
      )}

      {showDebug && (
        <div className="fixed top-20 right-6 z-50 bg-black/99 text-white border border-white/20 rounded-2xl shadow-2xl p-6 text-[10px] font-mono max-w-xs backdrop-blur-xl">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
            <strong>SYSTEM DEBUG</strong>
            <button onClick={() => setShowDebug(false)}>✕</button>
          </div>
          <div className="space-y-1 opacity-80">
            <div>SYNC: {lastSynced || "WAITING"}</div>
            <div>STATION: {stationId}</div>
            <div>PHASE: {currentPhase}</div>
            <div>TIME: {timeLeft}s</div>
            <div className="truncate">PLAN: {JSON.stringify(plan)}</div>
          </div>
        </div>
      )}

      {/* Edit Mode Controls Panel */}
      {isEditMode && (
        <div className="fixed top-20 left-6 z-50 bg-black/95 text-white border border-white/20 rounded-2xl shadow-2xl p-6 text-xs backdrop-blur-xl max-w-sm">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
            <strong className="text-sm">LAYOUT EDITOR</strong>
            <button
              onClick={() => setIsEditMode(false)}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Video Fit Mode */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider opacity-60 mb-2">
                Video Fit Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['cover', 'contain', 'fill'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => !layoutConfig.locked && setLayoutConfig(prev => ({ ...prev, videoFit: mode }))}
                    className={`px-3 py-2 rounded-lg text-[10px] uppercase tracking-wide transition-all ${
                      layoutConfig.videoFit === mode
                        ? 'bg-white text-black shadow-lg'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    } ${layoutConfig.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-[9px] opacity-50">
                {layoutConfig.videoFit === 'cover' && 'Fills screen, may crop edges'}
                {layoutConfig.videoFit === 'contain' && 'Shows full video, adds letterbox'}
                {layoutConfig.videoFit === 'fill' && 'Stretches to fill, may distort'}
              </div>
            </div>

            {/* Video Scale */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider opacity-60 mb-2">
                Video Scale: {layoutConfig.videoScale}%
              </label>
              <input
                type="range"
                min="50"
                max="200"
                value={layoutConfig.videoScale}
                onChange={(e) => !layoutConfig.locked && setLayoutConfig(prev => ({ ...prev, videoScale: Number(e.target.value) }))}
                disabled={layoutConfig.locked}
                className="w-full accent-white"
              />
            </div>

            {/* Video Position */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider opacity-60 mb-2">
                Video Position (X: {Math.round(layoutConfig.videoPosition.x)}%, Y: {Math.round(layoutConfig.videoPosition.y)}%)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layoutConfig.videoPosition.x}
                  onChange={(e) => !layoutConfig.locked && setLayoutConfig(prev => ({
                    ...prev,
                    videoPosition: { ...prev.videoPosition, x: Number(e.target.value) }
                  }))}
                  disabled={layoutConfig.locked}
                  className="w-full accent-white"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layoutConfig.videoPosition.y}
                  onChange={(e) => !layoutConfig.locked && setLayoutConfig(prev => ({
                    ...prev,
                    videoPosition: { ...prev.videoPosition, y: Number(e.target.value) }
                  }))}
                  disabled={layoutConfig.locked}
                  className="w-full accent-white"
                />
              </div>
            </div>

            {/* Black Bars (Design Overlays) */}
            <div className="pt-2 border-t border-white/10">
              <label className="block text-[10px] uppercase tracking-wider opacity-60 mb-2">
                Black Bars (Design Overlays)
              </label>
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div>
                  <span className="opacity-50">Top</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={layoutConfig.blackBars.top}
                    onChange={(e) => !layoutConfig.locked && setLayoutConfig(prev => ({
                      ...prev,
                      blackBars: { ...prev.blackBars, top: Number(e.target.value) }
                    }))}
                    disabled={layoutConfig.locked}
                    className="w-full mt-1 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-center"
                  />
                </div>
                <div>
                  <span className="opacity-50">Bottom</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={layoutConfig.blackBars.bottom}
                    onChange={(e) => !layoutConfig.locked && setLayoutConfig(prev => ({
                      ...prev,
                      blackBars: { ...prev.blackBars, bottom: Number(e.target.value) }
                    }))}
                    disabled={layoutConfig.locked}
                    className="w-full mt-1 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-center"
                  />
                </div>
                <div>
                  <span className="opacity-50">Left</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={layoutConfig.blackBars.left}
                    onChange={(e) => !layoutConfig.locked && setLayoutConfig(prev => ({
                      ...prev,
                      blackBars: { ...prev.blackBars, left: Number(e.target.value) }
                    }))}
                    disabled={layoutConfig.locked}
                    className="w-full mt-1 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-center"
                  />
                </div>
                <div>
                  <span className="opacity-50">Right</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={layoutConfig.blackBars.right}
                    onChange={(e) => !layoutConfig.locked && setLayoutConfig(prev => ({
                      ...prev,
                      blackBars: { ...prev.blackBars, right: Number(e.target.value) }
                    }))}
                    disabled={layoutConfig.locked}
                    className="w-full mt-1 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-center"
                  />
                </div>
              </div>
              <div className="mt-2 text-[9px] opacity-50">
                Add intentional black space (0-50% each side)
              </div>
            </div>

            {/* Lock/Unlock Layout */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => setLayoutConfig(prev => ({ ...prev, locked: !prev.locked }))}
                className={`w-full px-4 py-3 rounded-lg text-[11px] uppercase tracking-wider font-bold transition-all ${
                  layoutConfig.locked
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                    : 'bg-green-500/20 text-green-400 border border-green-500/50'
                }`}
              >
                {layoutConfig.locked ? '🔒 Layout Locked' : '🔓 Layout Unlocked'}
              </button>
              <div className="mt-2 text-[9px] opacity-50 text-center">
                {layoutConfig.locked ? 'Click to unlock and enable editing' : 'Click to lock current layout'}
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => !layoutConfig.locked && setLayoutConfig({
                videoFit: 'cover',
                videoScale: 100,
                videoPosition: { x: 50, y: 50 },
                blackBars: { top: 0, bottom: 0, left: 0, right: 0 },
                locked: false
              })}
              disabled={layoutConfig.locked}
              className={`w-full px-4 py-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 text-[10px] uppercase tracking-wide transition-all ${
                layoutConfig.locked ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
