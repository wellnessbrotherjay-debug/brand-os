"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { resolveBrandColors } from "@/lib/workout-engine/brand-colors";
import { useVenueContext } from "@/lib/venue-context";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
});

const PHASE_LABEL: Record<SessionPhase, string> = {
  prep: "Get Ready",
  work: "Work",
  rest: "Rest",
  change: "Station Change",
  complete: "Complete",
};

const PHASE_TONE: Record<SessionPhase, string> = {
  prep: "#F1EDE5", // Beige
  work: "#FF4D4D", // Red
  rest: "#C8A871", // Gold
  change: "#C8A871", // Gold
  complete: "#C8A871", // Gold
};

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}m ${sec.toString().padStart(2, "0")}s`;
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

export default function TimerDisplayPage() {
  const [setup, setSetup] = useState<WorkoutSetup | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const lastPhaseRef = useRef<SessionPhase | null>(null);
  const countdownCallouts = useRef<Set<number>>(new Set());
  const { activeVenue } = useVenueContext();
  const [globalTimer, setGlobalTimer] = useState({
    timeLeft: 0,
    phase: 'prep' as SessionPhase,
    isActive: false,
    workTime: 45,
    restTime: 45, // Updated for Studio A
    targetEndTime: null as Date | null,
    setNumber: 1, // Added for Studio A
  });

  // Hardcode brand colors to Beige and White - NO BLUE, NO YELLOW
  const brandColors = {
    primary: "#FFFFFF",   // White
    secondary: "#F1EDE5", // Beige
    accent: "#F1EDE5",    // Beige
  };

  const { primary: primaryBrand, secondary: secondaryBrand, accent: accentBrand } = brandColors;

  useEffect(() => {
    const nextSetup = storage.getSetup();
    setSetup(nextSetup);
    setPlan(storage.getPlan());
    const nextSession = storage.getSession();
    setSession(nextSession);
    setTimeLeft(nextSession?.remaining ?? nextSetup?.workTime ?? 0);
  }, []);

  useEffect(() => {
    const handleSetup = (nextSetup: WorkoutSetup | null) => setSetup(nextSetup);
    const handlePlan = (nextPlan: WorkoutPlan | null) => {
      setPlan(nextPlan);
      setLastUpdated(new Date().toLocaleString());
    };
    const handleSession = (nextSession: SessionState | null) => {
      setSession(nextSession);
      setTimeLeft(nextSession?.remaining ?? 0);
    };

    const unsubSetup = storage.subscribe(STORAGE_KEYS.setup, handleSetup);
    const unsubPlan = storage.subscribe(STORAGE_KEYS.plan, handlePlan);
    const unsubSession = storage.subscribe(STORAGE_KEYS.session, handleSession);

    const interval = window.setInterval(() => {
      const latest = storage.getSession();
      if (!latest) return;
      setSession(latest);
      setTimeLeft(latest.remaining);
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

    const fetchPlan = async () => {
      try {
        const { data } = await supabaseClient
          .from("workouts")
          .select("data")
          .eq("id", "active")
          .single();
        if (data?.data) {
          storage.savePlan(data.data);
          setPlan(data.data);
          setLastUpdated(new Date().toLocaleString());
        }
      } catch (error) {
        console.error("Failed to refresh plan", error);
      }
    };

    fetchPlan();

    const channel = supabaseClient
      .channel("timer-display")
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
      .channel('global-timer-display')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'global_timer',
        filter: 'id=eq.active',
      }, (payload) => {
        const timerData = payload.new as any;
        console.log('🔥 Display timer: Global timer UPDATE received!', {
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

          console.log('Display timer: Phase switch to', timerData.phase, 'Time:', calculatedTimeLeft);

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
          console.log('Display timer: Using fallback for phase', timerData.phase);
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
        console.log('Display timer: Subscription status:', status);
      });

    // Local countdown that calculates from target time (MASTER - controls phase switching)
    const localInterval = setInterval(() => {
      setGlobalTimer(prev => {
        if (!prev.isActive || !prev.targetEndTime) return prev;

        // Calculate time left from target end time - this eliminates sync drift!
        const targetEndTime = prev.targetEndTime.getTime();
        const now = Date.now();
        const diff = targetEndTime - now;

        let calculatedTimeLeft = Math.max(0, Math.ceil(diff / 1000));

        // Ensure we show at least 1 second if timer is active and target is in future
        if (diff > 100 && calculatedTimeLeft <= 0) {
          calculatedTimeLeft = 1;
        }

        // Detect when we've reached the end of current phase (Master Logic)
        if (calculatedTimeLeft <= 0 && diff <= 1000) {
          // Timer reached 0, switch phases automatically
          let nextPhase: SessionPhase = prev.phase === 'work' ? 'rest' : 'work';
          let nextSet = prev.setNumber;
          let nextTime = 45;
          const workTime = prev.workTime;
          const restTime = prev.restTime;

          if (prev.phase === 'work') {
            // After WORK...
            if (prev.setNumber >= (setup?.rounds ?? 4)) {
              // End of sets -> Station Change
              nextPhase = 'change';
              nextTime = 60; // Station change is usually fixed at 60s
            } else {
              // Normal Rest
              nextPhase = 'rest';
              nextTime = restTime;
            }
          } else if (prev.phase === 'rest' || prev.phase === 'change' || prev.phase === 'prep') {
            // After REST or CHANGE or PREP -> Back to WORK (next set or new station)
            nextPhase = 'work';
            nextTime = workTime;
            if (prev.phase === 'change') {
               nextSet = 1; // Reset to set 1 after station change
            } else if (prev.phase === 'rest') {
               nextSet = prev.setNumber + 1; // Increment set number
            }
          }

          const newTargetEndTime = new Date(Date.now() + nextTime * 1000);

          console.log('🚨 MASTER Timer Phase switch:', prev.phase, '->', nextPhase, 'Set:', nextSet, 'Time:', nextTime);

          // Update Supabase with new phase and target time - all slave devices will follow
          supabaseClient
            .from('global_timer')
            .update({
              phase: nextPhase,
              target_end_time: newTargetEndTime.toISOString(),
              time_left: nextTime,
              set_number: nextSet, // Assuming this column exists
              updated_at: new Date().toISOString(),
            })
            .eq('id', 'active')
            .then(({ error }) => {
              if (error) console.error('❌ MASTER Failed to update Supabase:', error);
            });

          // Update local state immediately for smooth UI
          return {
            ...prev,
            timeLeft: nextTime,
            phase: nextPhase,
            setNumber: nextSet,
            targetEndTime: newTargetEndTime,
          };
        }

        return {
          ...prev,
          timeLeft: calculatedTimeLeft,
        };
      });
    }, 100); // Back to 100ms for Master accuracy

    // Fetch initial timer state (READ-ONLY) - do this immediately
    const fetchTimer = async () => {
      console.log('Display timer: Fetching initial timer state...');
      const { data, error } = await supabaseClient
        .from('global_timer')
        .select('*')
        .eq('id', 'active')
        .single();

      console.log('Display timer: Fetched timer data:', data, 'Error:', error);

      if (data) {
        let calculatedTimeLeft = 45; // Default to 45 seconds
        let targetEndTime = null;
        let phase = data.phase || 'work'; // Default to work phase
        let isActive = true; // Always force active for display timer

        if (data.target_end_time) {
          // Use target end time for precise calculation
          targetEndTime = new Date(data.target_end_time);
          const now = Date.now();
          const diff = targetEndTime.getTime() - now;

          // Calculate time left, but ensure it's reasonable
          if (diff > 0) {
            calculatedTimeLeft = Math.ceil(diff / 1000);
            console.log('Display timer: Using target end time:', data.target_end_time, 'Calculated:', calculatedTimeLeft);
          } else {
            // Target is in the past, timer might be expired
            console.log('Display timer: Target end time is in the past, using default');
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
          console.log('Display timer: Set target end time for existing timer');
        }

        // Ensure we never show 00:00 when timer should be active
        if (calculatedTimeLeft <= 0) {
          console.log('Display timer: Calculated time <= 0 but timer is active, using default');
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
          isActive: isActive, // Always true for display timer
          workTime: data.work_time || 45,
          restTime: data.rest_time || 45,
          targetEndTime: targetEndTime,
          setNumber: data.set_number || 1,
        });
        setTimeLeft(calculatedTimeLeft);
        console.log('Display timer: Initial sync complete - timeLeft:', calculatedTimeLeft, 'phase:', phase);
      } else if (!error) {
        // No timer exists, create one (display-timer can create as backup)
        console.log('Display timer: No timer found, creating one...');
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
            restTime: 45,
            targetEndTime: newTargetEndTime,
            setNumber: 1,
          });
          console.log('Display timer: Created new timer');
        }
      } else {
        console.log('Display timer: Error fetching timer:', error);
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

          console.log('🔄 Display timer: Polling update - phase:', data.phase, 'timeLeft:', calculatedTimeLeft);

          setGlobalTimer({
            timeLeft: calculatedTimeLeft,
            phase: data.phase || 'work',
            isActive: true,
            workTime: data.work_time || 45,
            restTime: data.rest_time || 45,
            targetEndTime: targetEndTime,
            setNumber: data.set_number || 1,
          });
        }
      } catch (error) {
        console.error('Display timer: Polling error:', error);
      }
    }, 1000); // Poll every 1 second

    return () => {
      if (channel) supabaseClient.removeChannel(channel);
      if (timerChannel) supabaseClient.removeChannel(timerChannel);
      clearInterval(localInterval);
      clearInterval(pollInterval);
    };
  }, []);

  // Always use global timer if it has valid data, otherwise fall back to session timer
  const hasValidGlobalTimer = globalTimer.timeLeft >= 0 && globalTimer.targetEndTime !== null;
  const phase: SessionPhase = hasValidGlobalTimer ? globalTimer.phase : (session?.phase ?? "prep");
  const phaseColor = PHASE_TONE[phase];
  const displayTimeLeft = hasValidGlobalTimer ? globalTimer.timeLeft : timeLeft;

  // Optimized refresh effect
  useEffect(() => {
    if (hasValidGlobalTimer && !globalTimer.isActive) {
      setGlobalTimer(prev => ({ ...prev, isActive: true }));
    }
  }, [hasValidGlobalTimer, globalTimer.isActive]);
  const timerText = formatTime(displayTimeLeft);
  const roundsSummary =
    setup && session
      ? `Round ${session.round} / ${setup.rounds}`
      : setup
        ? `Rounds: ${setup.rounds}`
        : "Rounds: --";
  const facilityName = setup?.facilityName ?? "AVRL";
  const totalWork = globalTimer.workTime;
  const totalRest = globalTimer.restTime;
  const setSummary = `SET ${globalTimer.setNumber} OF ${setup?.rounds ?? 4}`;
  const intervalSummary = `${totalWork}s work • ${totalRest}s rest`;
  const nextPhase: SessionPhase =
    phase === "prep" ? "work" : phase === "work" ? "rest" : phase === "rest" ? "work" : "complete";
  const nextPhaseLabel = PHASE_LABEL[nextPhase];
  const nextPhaseColor = PHASE_TONE[nextPhase];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;

    const speak = (phrase: string) => {
      if (!phrase.trim()) return;
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 1.05;
      utterance.pitch = 1;
      utterance.volume = 0.85;
      synth.cancel();
      synth.speak(utterance);
    };

    if (phase !== lastPhaseRef.current) {
      lastPhaseRef.current = phase;
      countdownCallouts.current.clear();
      const phaseMessage =
        phase === "work"
          ? "Work. All in."
          : phase === "rest"
            ? "Rest and rotate."
            : phase === "prep"
              ? "Get ready."
              : "Workout complete. Great job.";
      speak(phaseMessage);
    }

    if (phase === "complete") return;
    if (displayTimeLeft <= 5 && displayTimeLeft > 0 && !countdownCallouts.current.has(displayTimeLeft)) {
      countdownCallouts.current.add(displayTimeLeft);
      speak(displayTimeLeft === 1 ? "One" : `${displayTimeLeft}`);
    }

    if (displayTimeLeft === 0 && (phase === "work" || phase === "rest" || phase === "prep") && !countdownCallouts.current.has(0)) {
      countdownCallouts.current.add(0);
      speak("Switch");
    }
  }, [phase, displayTimeLeft]);

  return (
    <main
      className={`${orbitron.variable} ${orbitron.className} relative flex min-h-screen w-screen items-center justify-center bg-black text-white`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#202020,transparent_55%)]" />

      {/* Debug Info - Always visible for troubleshooting */}
      <div className="absolute top-4 left-4 bg-black/50 text-white p-2 text-xs font-mono rounded z-50">
        <div>isActive: {globalTimer.isActive.toString()}</div>
        <div>timeLeft: {globalTimer.timeLeft}</div>
        <div>phase: {globalTimer.phase}</div>
        <div>phaseColor: {phaseColor}</div>
        <div>targetEndTime: {globalTimer.targetEndTime ? globalTimer.targetEndTime.toISOString() : 'null'}</div>
        <div>displayTimeLeft: {displayTimeLeft}</div>
      </div>

      <div className="relative flex h-full w-full flex-col gap-12 px-6 py-10 lg:px-12 lg:py-12">
        <header className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-5xl font-extrabold uppercase md:text-7xl tracking-[0.2em]" style={{ color: "#F1EDE5" }}>
            AVRL
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.35em]" style={{ color: hexToRgba(accentBrand, 0.7) }}>
            <span>{intervalSummary}</span>
            <span>•</span>
            <span>{setSummary}</span>
            <span>•</span>
            <span>{roundsSummary}</span>
          </div>
        </header>

        <div className="grid flex-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div
            className="relative flex flex-col items-center justify-center rounded-[24px] border-2 px-10 py-12 text-center shadow-[0_0_60px_rgba(0,0,0,0.45)]"
            style={{
              borderColor: phaseColor,
              backgroundColor: hexToRgba(phaseColor, 0.12),
              boxShadow: `0 0 55px ${hexToRgba(phaseColor, 0.25)}`,
            }}
          >
            <p className="text-sm uppercase tracking-[0.45em] md:text-base" style={{ color: phaseColor }}>
              {PHASE_LABEL[phase]} {phase !== 'change' && phase !== 'complete' && phase !== 'prep' ? `• SET ${globalTimer.setNumber}` : ''}
            </p>
            <p
              className="mt-8 text-[9rem] font-black leading-none tracking-[0.12em] md:text-[12rem]"
              style={{ color: phaseColor, textShadow: `0 0 55px ${hexToRgba(phaseColor, 0.35)}` }}
            >
              {timerText}
            </p>
            <p className="mt-6 text-sm uppercase tracking-[0.35em]" style={{ color: hexToRgba(accentBrand, 0.7) }}>
              Next: <span style={{ color: nextPhaseColor }}>{nextPhaseLabel}</span>
            </p>
          </div>

          <aside className="flex flex-col justify-between gap-6 rounded-[24px] border border-white/10 bg-black/60 px-6 py-8 text-sm shadow-[0_0_45px_rgba(0,0,0,0.4)] backdrop-blur-md">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.4em] text-[#F1EDE5]">
                Interval Blueprint
              </p>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/50 px-4 py-3">
                <span className="text-xs uppercase tracking-[0.35em] text-white/50">
                  Work
                </span>
                <span className="text-2xl font-bold text-white">{totalWork ? `${totalWork}s` : "--"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/50 px-4 py-3">
                <span className="text-xs uppercase tracking-[0.35em] text-white/50">
                  Change
                </span>
                <span className="text-2xl font-bold text-white">{totalRest ? `${totalRest}s` : "--"}</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.4em] text-[#F1EDE5]">
                Guidance
              </p>
              <p className="text-sm leading-relaxed text-neutral-300">
                Audio prompts call out every phase transition and a five second countdown.
                Rotate stations when you hear “Switch” and stay synced with the displayed timer.
              </p>
            </div>

            <div className="space-y-2 text-xs uppercase tracking-[0.3em] text-white/70">
              <p>Active Station: {session?.stationId ? `Station ${session.stationId}` : "TBD"}</p>
              <p>Next Cue In: {formatDuration(Math.max(0, displayTimeLeft))}</p>
              <p>{lastUpdated ? `Synced ${lastUpdated}` : "Local mode"}</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
