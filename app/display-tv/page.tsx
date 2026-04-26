"use client";

import { Suspense, useEffect, useMemo, useState, useRef, useCallback } from "react";
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

// Premium Boutique Fonts & Luxury Animations
const FontStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@200;300;400;500;600;700&display=swap');

    .font-serif {
      font-family: 'Cormorant Garamond', serif;
    }
    .font-sans {
      font-family: 'Montserrat', sans-serif;
    }

    /* Pristine Cream Background with subtle studio lighting */
    .bg-studio-cream {
      background-color: #F8F6F0;
      background-image: radial-gradient(circle at 50% 0%, #FFFFFF 0%, #F8F6F0 60%, #EBE6DC 100%);
    }

    /* Enhanced Luxury Metallic Gold Foil Effect */
    .text-gold-foil {
      background-image: linear-gradient(135deg, #AA7D39 0%, #E8D3A2 30%, #C69C50 50%, #E8D3A2 70%, #8A5F20 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
      animation: foilShine 6s linear infinite;
    }

    @keyframes foilShine {
      to { background-position: 200% center; }
    }

    /* Smooth sweeping animation for the SVG ring */
    .progress-ring-circle {
      transition: stroke-dashoffset 0.1s linear, stroke 0.5s ease-in-out;
    }

    /* Soft floating for the active timeline node */
    @keyframes softFloat {
      0%, 100% { transform: translateY(0) scale(1.15); box-shadow: 0 10px 20px -5px rgba(170, 125, 57, 0.3); }
      50% { transform: translateY(-4px) scale(1.15); box-shadow: 0 15px 25px -5px rgba(170, 125, 57, 0.4); }
    }
    .timeline-active-node {
      animation: softFloat 3s ease-in-out infinite;
    }
    
    /* Subtle pulse for the center time */
    @keyframes timePulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.95; transform: scale(0.98); }
    }
    .time-active-pulse {
      animation: timePulse 2s ease-in-out infinite;
    }
  ` }} />
);

// Elegant Header Logo
const AvrlLogo = () => (
  <div className="flex flex-col items-center justify-center relative z-10 pt-4">
    <Image
      src="/logos/global-avrl-logo.png"
      alt="AVRL Logo"
      width={400}
      height={200}
      className="h-[200px] w-auto object-contain"
    />
  </div>
);

function DisplayTvContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeOverride = searchParams?.get('mode') as 'studio-a' | 'studio-b' | null;

  const [setup, setSetup] = useState<WorkoutSetup | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Perpetual 24/7 State
  const [perpetualState, setPerpetualState] = useState({
    timeLeft: 0,
    phase: 'prep' as SessionPhase,
    round: 1,
    stationId: 1,
    workTime: 45,
    restTime: 15,
    totalRounds: 1,
    totalStations: 6
  });
  const [audioStatus, setAudioStatus] = useState<'blocked' | 'muted' | 'ready'>('blocked');

  const { activeVenue } = useVenueContext();

  const toggleFullscreen = async () => {
    try {
      const doc = document as any;
      const elem = document.documentElement as any;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        if (elem.requestFullscreen) await elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
      } else {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) audioContextRef.current = new Ctx();
    }
    return audioContextRef.current;
  }, []);

  const playBeep = useCallback((freq = 440, type: OscillatorType = 'sine', duration = 0.3, vol = 0.1) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      
      // Resume if suspended (browser policy)
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error("Beep Error:", e);
    }
  }, [getAudioContext]);

  const preloadedAudioRef = useRef<Record<string, HTMLAudioElement>>({});
  
  const playSpeech = useCallback(async (phrase: string) => {
     try {
       // Also resume AudioContext for Speech if needed (though HTMLAudio handles it slightly differently)
       const ctx = getAudioContext();
       if (ctx && ctx.state === 'suspended') ctx.resume();

       let audio = preloadedAudioRef.current[phrase];
       if (!audio) {
         audio = new window.Audio(`/api/speech?text=${encodeURIComponent(phrase)}`);
         preloadedAudioRef.current[phrase] = audio;
       }
       audio.currentTime = 0;
       await audio.play();
     } catch(e) {
       // Fallback to Native Speech Synthesis
       if (window.speechSynthesis) {
         window.speechSynthesis.cancel(); // Clear queue
         const u = new SpeechSynthesisUtterance(phrase);
         u.rate = 1.1;
         window.speechSynthesis.speak(u);
       }
     }
  }, [getAudioContext]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      setIsFullscreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement));
    };
    
    // Auto-resume check
    const checkAudio = () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'running') setAudioStatus('ready');
      else setAudioStatus('blocked');
    };
    const interval = setInterval(checkAudio, 1000);

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [getAudioContext]);

  useEffect(() => {
    const nextSetup = storage.getSetup();
    if (!nextSetup) {
      setError("Setup missing.");
      router.replace("/setup");
      return;
    }
    setSetup(nextSetup);
    setPlan(storage.getPlan());
    setSession(storage.getSession());

    // 1. Sync from Supabase for direct UI pushes (Legacy/Manual)
    const pushChannel = supabaseClient
      .channel('tv-workout-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'workouts' }, payload => {
        const nextPlan = payload.new?.data as WorkoutPlan;
        if (nextPlan) {
          setPlan(nextPlan);
          storage.savePlan(nextPlan);
        }
      })
      .subscribe();

    // 2. Schedule Monitor: Check for calendar-based sessions for this studio
    const studioId = searchParams?.get('studio') || 'studio-a';
    
    const checkSchedule = async () => {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

      // Fetch active schedules for this studio today
      const { data: activeSchedules } = await supabaseClient
        .from('schedules')
        .select('*, program:programs(*)')
        .eq('scheduled_day', today)
        .eq('studio_id', studioId)
        .lte('start_time', currentTimeStr);

      if (activeSchedules && activeSchedules.length > 0) {
        // Find the most recent one
        const latest = activeSchedules.sort((a,b) => b.start_time.localeCompare(a.start_time))[0];
        
        // Convert start_time to full Date to check duration
        const [sh, sm] = latest.start_time.split(':');
        const startTime = new Date(now);
        startTime.setHours(parseInt(sh), parseInt(sm), 0);
        
        const durationMs = (latest.duration_mins || 60) * 60 * 1000;
        const endTime = new Date(startTime.getTime() + durationMs);

        if (now >= startTime && now < endTime) {
          // If we have a program assigned, fetch its detailed day data
          if (latest.program_id) {
            const { data: progData } = await supabaseClient
              .from('program_days')
              .select('*')
              .eq('program_id', latest.program_id)
              .eq('day_number', 1) // Just take day 1 for now or based on some logic
              .single();

            if (progData?.data) {
                const nextPlan = {
                  ...progData.data,
                  name: latest.workout_name || progData.workout_name
                } as WorkoutPlan;
                
                // Only update if it's different to avoid re-renders
                if (plan?.name !== nextPlan.name) {
                  setPlan(nextPlan);
                  storage.savePlan(nextPlan);
                }
            }
          }
        }
      }
    };

    const scheduleInterval = setInterval(checkSchedule, 30000); // Check every 30s
    checkSchedule(); // Immediate check

    // Subscribe to schedule changes to trigger immediate update
    const scheduleChannel = supabaseClient
      .channel('tv-schedule-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        checkSchedule();
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(pushChannel);
      supabaseClient.removeChannel(scheduleChannel);
      clearInterval(scheduleInterval);
    };
  }, [router, searchParams, plan?.name]);

  const [activeSchedule, setActiveSchedule] = useState<any | null>(null);

  useEffect(() => {
    const nextSetup = storage.getSetup();
    if (!nextSetup) {
      setError("Setup missing.");
      router.replace("/setup");
      return;
    }
    setSetup(nextSetup);
    setPlan(storage.getPlan());
    setSession(storage.getSession());

    // 1. Sync from Supabase for direct UI pushes (Legacy/Manual)
    const pushChannel = supabaseClient
      .channel('tv-workout-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'workouts' }, payload => {
        const nextPlan = payload.new?.data as WorkoutPlan;
        if (nextPlan) {
          setPlan(nextPlan);
          storage.savePlan(nextPlan);
        }
      })
      .subscribe();

    // 2. Schedule Monitor: Check for calendar-based sessions for this studio
    const studioId = searchParams?.get('studio') || 'studio-a';
    
    const checkSchedule = async () => {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

      // Fetch active schedules for this studio today
      const { data: rawSchedules } = await supabaseClient
        .from('schedules')
        .select('*, program:programs(*)')
        .eq('scheduled_day', today)
        .eq('studio_id', studioId)
        .lte('start_time', currentTimeStr);

      const activeSchedules = rawSchedules as any[];

      if (activeSchedules && activeSchedules.length > 0) {
        // Find the most recent one
        const latestSelection = activeSchedules.sort((a: any, b: any) => b.start_time.localeCompare(a.start_time))[0];
        
        // Convert start_time to full Date to check duration
        const [sh, sm] = latestSelection.start_time.split(':');
        const startTime = new Date(now);
        startTime.setHours(parseInt(sh), parseInt(sm), 0);
        
        const durationMs = (latestSelection.duration_mins || 60) * 60 * 1000;
        const endTime = new Date(startTime.getTime() + durationMs);

        if (now >= startTime && now < endTime) {
          // Found an active schedule!
          setActiveSchedule(latestSelection);
          
          let nextPlan: WorkoutPlan | null = null;

          if (latestSelection.program_id) {
            const { data: progData } = await (supabaseClient
              .from('program_days')
              .select('*')
              .eq('program_id', latestSelection.program_id)
              .eq('day_number', 1) 
              .single() as any);

            if (progData?.data) {
                nextPlan = {
                  ...progData.data,
                  name: latestSelection.workout_name || progData.workout_name
                } as WorkoutPlan;
            }
          } else if (latestSelection.workout_id) {
            // Fetch from legacy workouts
            const { data: workoutData } = await (supabaseClient
              .from('workouts')
              .select('*')
              .eq('id', latestSelection.workout_id)
              .single() as any);

            if (workoutData?.data) {
                nextPlan = {
                  ...workoutData.data,
                  name: latestSelection.workout_name || workoutData.name
                } as WorkoutPlan;
            }
          }

          if (nextPlan && plan?.name !== nextPlan.name) {
             setPlan(nextPlan);
             storage.savePlan(nextPlan);
          }
        } else {
          setActiveSchedule(null);
        }
      } else {
        setActiveSchedule(null);
      }
    };

    const scheduleInterval = setInterval(checkSchedule, 30000); 
    checkSchedule(); 

    const scheduleChannel = supabaseClient
      .channel('tv-schedule-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        checkSchedule();
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(pushChannel);
      supabaseClient.removeChannel(scheduleChannel);
      clearInterval(scheduleInterval);
    };
  }, [router, searchParams, plan?.name]);

  // Perpetual State Calculation Logic (Schedule-Aware)
  useEffect(() => {
    const calculateState = () => {
      if (!setup) return;

      const now = new Date();
      let totalSecondsElapsed = 0;

      if (activeSchedule) {
        // Calculate elapsed time since class start
        const [sh, sm] = activeSchedule.start_time.split(':');
        const startTime = new Date(now);
        startTime.setHours(parseInt(sh), parseInt(sm), 0);
        totalSecondsElapsed = (now.getTime() - startTime.getTime()) / 1000;
      } else {
        // Fallback to 24/7 repeating circuit
        totalSecondsElapsed = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds() + (now.getMilliseconds() / 1000);
      }
      
      const workTime = setup.workTime || 45;
      const restTime = setup.restTime || 15;
      const roundsPerStation = setup.rounds || 1;
      const stationCount = setup.stations?.length || 6;

      const stationDuration = (workTime + restTime) * roundsPerStation;
      const totalCircuitDuration = stationDuration * stationCount;

      const currentCircuitTime = totalSecondsElapsed % totalCircuitDuration;
      const currentStationIndex = Math.floor(currentCircuitTime / stationDuration);
      const timeInStation = currentCircuitTime % stationDuration;

      const roundDuration = workTime + restTime;
      const currentRound = Math.floor(timeInStation / roundDuration) + 1;
      const timeInRound = timeInStation % roundDuration;

      let phase: SessionPhase = 'work';
      let timeLeft = 0;

      if (timeInRound < workTime) {
        phase = 'work';
        timeLeft = Math.ceil(workTime - timeInRound);
      } else {
        phase = 'rest';
        timeLeft = Math.ceil(roundDuration - timeInRound);
      }

      setPerpetualState({
        timeLeft,
        phase,
        round: currentRound,
        stationId: currentStationIndex + 1,
        workTime,
        restTime,
        totalRounds: roundsPerStation,
        totalStations: stationCount
      });
    };

    const interval = setInterval(calculateState, 50);
    return () => clearInterval(interval);
  }, [setup, plan, activeSchedule]);

  useEffect(() => {
    if (!supabaseClient) return;

    const channel = supabaseClient
      .channel("tv-workouts")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "workouts" }, (payload) => {
        const nextPlan = (payload.new as any)?.data as WorkoutPlan | undefined;
        if (nextPlan) {
          storage.savePlan(nextPlan);
          setPlan(nextPlan);
        }
      })
      .subscribe();

    return () => {
      if (channel) supabaseClient.removeChannel(channel);
    };
  }, []);

  const studioMode = modeOverride || plan?.studioMode || setup?.mode || 'studio-a';

  const stationGroups = useMemo(() => {
    if (!plan?.exercises) return [];
    const groups: Record<number, any[]> = {};
    plan.exercises.forEach(ex => {
      if (!groups[ex.stationId]) groups[ex.stationId] = [];
      groups[ex.stationId].push(ex);
    });
    Object.values(groups).forEach(group => group.sort((a, b) => (a.part || 0) - (b.part || 0)));
    return Object.entries(groups).map(([id, exercises]) => ({
      stationId: Number(id),
      exercises
    })).sort((a, b) => a.stationId - b.stationId);
  }, [plan]);

  const currentStationId = perpetualState.stationId || session?.stationId || stationGroups[0]?.stationId || null;
  const currentExercises = useMemo(() => {
    if (!currentStationId) return [];
    return (stationGroups.find((g) => g.stationId === currentStationId)?.exercises ?? []) as any[];
  }, [stationGroups, currentStationId]);

  const exerciseLabel = useMemo(() => {
    if (currentExercises.length === 0) return "Ready";
    return currentExercises.map(ex => ex.name).join(" + ");
  }, [currentExercises]);

  const currentPhase: SessionPhase = perpetualState.phase;
  const remainingTime = perpetualState.timeLeft;
  const currentRound = perpetualState.round;
  const totalRounds = perpetualState.totalRounds;

  // SVG Ring Calculations
  const radius = 220;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const maxTime = currentPhase === 'work' ? perpetualState.workTime : perpetualState.restTime;
  const strokeDashoffset = circumference - (remainingTime / maxTime) * circumference;

  const activeStation = stationGroups.find(s => s.stationId === currentStationId);

  // Audio Driver Trigger
  const previousTimeRef = useRef<number | null>(null);
  const previousPhaseRef = useRef<SessionPhase | null>(null);

  useEffect(() => {
    // Phase Change Announcement
    if (currentPhase !== previousPhaseRef.current) {
      const oldPhase = previousPhaseRef.current;
      previousPhaseRef.current = currentPhase;
      
      // Only announce transitions (not initial load)
      if (oldPhase !== null) {
        if (currentPhase === 'work') {
          playBeep(880, 'square', 0.5, 0.15);
          playSpeech("Work");
        } else if (currentPhase === 'rest') {
          playBeep(330, 'square', 0.5, 0.1);
          playSpeech("Rest");
        }
      }
    }

    // Countdown Logic (3, 2, 1)
    if (remainingTime !== previousTimeRef.current) {
      previousTimeRef.current = remainingTime;
      
      if (remainingTime === 3) {
        playBeep(440, 'sine', 0.2, 0.1);
      } else if (remainingTime === 2) {
        playBeep(440, 'sine', 0.2, 0.1);
      } else if (remainingTime === 1) {
        playBeep(880, 'sine', 0.3, 0.15); // Higher pitch for final second
      }
    }
  }, [currentPhase, remainingTime, playBeep, playSpeech]);

  return (
    <div 
      className="w-screen h-screen font-sans flex flex-col justify-between py-6 px-12 overflow-hidden bg-studio-cream select-none relative"
      onClick={() => {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume();
          playBeep(440, 'sine', 0.1, 0.05); // Quick feedback chirp
        }
      }}
    >
      <FontStyles />
      
      {/* Fullscreen Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={toggleFullscreen} className="w-10 h-10 rounded-full flex items-center justify-center bg-black/10 text-[#8A5F20] border border-[#AA7D39]/20 hover:bg-black/20 transition-all backdrop-blur-md">
          {isFullscreen ? <span className="text-lg font-black">⤓</span> : <span className="text-lg font-black">⤢</span>}
        </button>
      </div>

      {/* TOP HEADER SECTION */}
      <div className="w-full flex justify-between items-start z-10">
        <div className="flex flex-col gap-4">
          <AvrlLogo />
          
          {/* Audio Unlock Hint */}
          <div 
            onClick={async () => {
              const ctx = getAudioContext();
              if (ctx) await ctx.resume();
              playBeep(880, 'sine', 0.1, 0.05);
              playSpeech("Audio Ready");
              setAudioStatus('ready');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer ${audioStatus === 'ready' ? 'bg-green-50 border-green-200 opacity-50' : 'bg-red-50 border-red-200 animate-pulse'}`}
          >
            <span className="text-xs">{audioStatus === 'ready' ? '🔊' : '🔇'}</span>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#8A5F20]">
              {audioStatus === 'ready' ? 'Audio Live' : 'Tap to Enable Audio'}
            </span>
          </div>
        </div>
        
        {/* Class Details - Moved to top right for a cleaner center */}
        <div className="flex flex-col items-end pt-8">
          <p className="text-[#8A5F20] text-[10px] font-bold tracking-[0.3em] uppercase mb-1">
            Circuit Format
          </p>
          <h2 className="text-[#2D2D2D] font-serif text-3xl tracking-wider mb-2">
            {plan?.name || "Melt & Tone"}
          </h2>
          <div className="flex items-center space-x-3 text-[#6B6B6B] text-[11px] font-semibold tracking-[0.2em] uppercase bg-white/50 px-5 py-2 rounded-full border border-[#EBE6DC]">
            <span>{perpetualState.workTime}s Work</span>
            <span className="w-1 h-1 rounded-full bg-[#C69C50]"></span>
            <span>{perpetualState.restTime}s Rest</span>
            <span className="w-1 h-1 rounded-full bg-[#C69C50]"></span>
            <span>RND {currentRound}/{totalRounds}</span>
          </div>
        </div>
      </div>

      {/* CENTER HERO SECTION (The Biocircuit Focus) */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        

        


        {/* Massive Sweeping Timer Ring */}
        <div className="relative flex items-center justify-center">
          {/* Background Track Ring */}
          <svg height={radius * 2} width={radius * 2} className="absolute transform -rotate-90 drop-shadow-sm">
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#AA7D39" />
                <stop offset="30%" stopColor="#E8D3A2" />
                <stop offset="50%" stopColor="#C69C50" />
                <stop offset="70%" stopColor="#E8D3A2" />
                <stop offset="100%" stopColor="#8A5F20" />
              </linearGradient>
            </defs>
            <circle
              stroke="#EBE6DC"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Animated Progress Ring */}
            <circle
              className="progress-ring-circle"
              stroke={currentPhase === 'work' ? "url(#goldGradient)" : "#2D2D2D"}
              fill="transparent"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>

          {/* Inner Content */}
          <div className="flex flex-col items-center justify-center w-[350px] h-[350px] bg-white rounded-full shadow-[inset_0_4px_30px_rgba(0,0,0,0.03),0_10px_40px_rgba(170,125,57,0.05)] border border-[#F8F6F0]">
            <p className={`text-[12px] font-bold tracking-[0.4em] uppercase mb-4 transition-colors duration-500 ${currentPhase === 'work' ? 'text-[#C69C50]' : 'text-[#2D2D2D]'}`}>
              {currentPhase === 'work' ? 'Active Work' : 'Recovery'}
            </p>
            
            <div className="flex items-start time-active-pulse">
              <span className={`font-serif text-[9rem] leading-[0.8] font-light tabular-nums tracking-tighter drop-shadow-sm ${currentPhase === 'work' ? 'text-gold-foil' : 'text-[#2D2D2D]'}`}>
                {remainingTime}
              </span>
            </div>
            
            <p className="font-sans text-[#8A5F20] text-[14px] tracking-[0.3em] uppercase mt-6 opacity-80">
              Seconds
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM TIMELINE (The Track) */}
      <div className="w-full h-[200px] bg-white rounded-[2.5rem] border border-[#E8D3A2]/40 shadow-[0_10px_40px_rgba(0,0,0,0.02)] flex flex-col justify-center px-12 relative z-10 mb-4">
        
        {/* The Track Line */}
        <div className="absolute top-[45%] left-16 right-16 h-[2px] bg-[#EBE6DC] z-0"></div>
        {/* Active Track Highlight (draws a gold line up to the current station) */}
        <div 
          className="absolute top-[45%] left-16 h-[2px] bg-gradient-to-r from-[#AA7D39] to-[#E8D3A2] z-0 transition-all duration-1000 ease-in-out"
          style={{ width: `calc(${(((currentStationId || 1) - 1) / (stationGroups.length - 1 || 1)) * 100}% - 4rem)` }}
        ></div>

        <div className="flex justify-between items-start w-full relative z-10">
          {stationGroups.map((group) => {
            const isActive = group.stationId === currentStationId;
            const isPast = currentStationId ? group.stationId < currentStationId : false;
            const exerciseLabel = group.exercises.map(ex => ex.name).join(" + ");
            const exerciseCategory = group.exercises[0]?.category || "BODYWEIGHT";
            
            return (
              <div key={group.stationId} className="flex flex-col items-center w-32">
                
                {/* Station Node/Circle */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-serif transition-all duration-700
                  ${isActive 
                    ? "bg-white border-[3px] border-[#C69C50] text-[#C69C50] font-bold timeline-active-node" 
                    : isPast
                      ? "bg-[#F8F6F0] border-2 border-[#C69C50] text-[#C69C50] opacity-60"
                      : "bg-white border-2 border-[#EBE6DC] text-[#A0A0A0]"
                  }
                `}>
                  {group.stationId}
                </div>

                {/* Station Info */}
                <div className={`mt-6 text-center transition-all duration-700 ${isActive ? 'transform -translate-y-1' : ''}`}>
                  <p className={`text-[9px] font-bold tracking-[0.2em] uppercase mb-1.5 ${isActive ? 'text-[#8A5F20]' : 'text-[#A0A0A0]'}`}>
                    {exerciseCategory}
                  </p>
                  <p className={`font-serif text-[15px] leading-tight ${isActive ? 'text-[#2D2D2D] font-semibold' : 'text-[#8B8B8B]'}`}>
                    {exerciseLabel}
                  </p>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-red-900/90 backdrop-blur-md border border-red-500/50 text-xs uppercase tracking-widest text-white shadow-2xl">
          {error}
        </div>
      )}
    </div>
  );
}

