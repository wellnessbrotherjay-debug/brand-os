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
    restTime: 15,
    targetEndTime: null as Date | null,
    setNumber: 1,
    activeStationId: 1,
  });

  // Local state for override inputs
  const [customWorkTime, setCustomWorkTime] = useState(45);
  const [customRestTime, setCustomRestTime] = useState(15);

  const brandColors = {
    primary: "#FFFFFF",
    secondary: "#F1EDE5",
    accent: "#F1EDE5",
  };

  const { accent: accentBrand } = brandColors;

  const stationCount = useMemo(() => {
    if (!plan?.exercises) return 12; // Default
    const ids = new Set(plan.exercises.map(e => Number(e.stationId)));
    return ids.size || 12;
  }, [plan]);

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

    return () => {
      unsubSetup?.();
      unsubPlan?.();
      unsubSession?.();
    };
  }, []);

  useEffect(() => {
    if (!supabaseClient) return;

    const channel = supabaseClient
      .channel('global-timer-master')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'global_timer',
        filter: 'id=eq.active',
      }, (payload) => {
        const timerData = payload.new as any;
        if (timerData && timerData.target_end_time) {
          const targetEndTime = new Date(timerData.target_end_time).getTime();
          const now = Date.now();
          const calculatedTimeLeft = Math.max(0, Math.ceil((targetEndTime - now) / 1000));

          setGlobalTimer({
            timeLeft: calculatedTimeLeft,
            phase: timerData.phase || 'work',
            isActive: true,
            workTime: timerData.work_time,
            restTime: timerData.rest_time,
            targetEndTime: new Date(timerData.target_end_time),
            setNumber: timerData.set_number || 1,
            activeStationId: timerData.active_station_id || 1,
          });
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
        const targetEndTime = data.target_end_time ? new Date(data.target_end_time) : new Date(Date.now() + (data.time_left || 45) * 1000);
        const now = Date.now();
        const diff = targetEndTime.getTime() - now;
        const calculatedTimeLeft = Math.max(0, Math.ceil(diff / 1000));

        setGlobalTimer({
          timeLeft: calculatedTimeLeft,
          phase: (data.phase as SessionPhase) || 'work',
          isActive: true,
          workTime: data.work_time || 45,
          restTime: data.rest_time || 15,
          targetEndTime: targetEndTime,
          setNumber: data.set_number || 1,
          activeStationId: data.active_station_id || 1,
        });
        setCustomWorkTime(data.work_time || 45);
        setCustomRestTime(data.rest_time || 15);
      }
    };

    fetchTimer();

    const localInterval = setInterval(() => {
      setGlobalTimer(prev => {
        if (!prev.isActive || !prev.targetEndTime) return prev;

        const targetEndTime = prev.targetEndTime.getTime();
        const now = Date.now();
        const diff = targetEndTime - now;
        let calculatedTimeLeft = Math.max(0, Math.ceil(diff / 1000));

        if (calculatedTimeLeft <= 0 && diff <= 500) {
          let nextPhase: SessionPhase = prev.phase === 'work' ? 'rest' : 'work';
          let nextSet = prev.setNumber;
          let nextStationId = prev.activeStationId;
          let nextTime = prev.workTime;

          if (prev.phase === 'work') {
            if (prev.setNumber >= (setup?.rounds ?? 4)) {
              nextPhase = 'change';
              nextTime = 60;
            } else {
              nextPhase = 'rest';
              nextTime = prev.restTime;
            }
          } else if (prev.phase === 'rest' || prev.phase === 'change' || prev.phase === 'prep') {
            nextPhase = 'work';
            nextTime = prev.workTime;
            if (prev.phase === 'change') {
              nextSet = 1;
              nextStationId = (nextStationId % stationCount) + 1;
            } else if (prev.phase === 'rest') {
              nextSet = prev.setNumber + 1;
            }
          }

          const newTargetEndTime = new Date(Date.now() + nextTime * 1000);

          supabaseClient?.from('global_timer').update({
            phase: nextPhase,
            target_end_time: newTargetEndTime.toISOString(),
            time_left: nextTime,
            set_number: nextSet,
            active_station_id: nextStationId,
            updated_at: new Date().toISOString(),
          }).eq('id', 'active').then();

          return {
            ...prev,
            timeLeft: nextTime,
            phase: nextPhase,
            setNumber: nextSet,
            activeStationId: nextStationId,
            targetEndTime: newTargetEndTime,
          };
        }

        return { ...prev, timeLeft: calculatedTimeLeft };
      });
    }, 100);

    return () => {
      if (channel) supabaseClient.removeChannel(channel);
      clearInterval(localInterval);
    };
  }, [setup, stationCount]);

  const updateSettings = async () => {
    if (!supabaseClient) return;
    const newTarget = new Date(Date.now() + customWorkTime * 1000);
    
    await supabaseClient
      .from('global_timer')
      .update({
        work_time: customWorkTime,
        rest_time: customRestTime,
        time_left: customWorkTime,
        target_end_time: newTarget.toISOString(),
        phase: 'work',
        set_number: 1,
        active_station_id: 1,
      })
      .eq('id', 'active');
    
    setGlobalTimer(prev => ({
      ...prev,
      workTime: customWorkTime,
      restTime: customRestTime,
      timeLeft: customWorkTime,
      targetEndTime: newTarget,
      phase: 'work',
      setNumber: 1,
      activeStationId: 1,
    }));
  };

  const phase: SessionPhase = globalTimer.isActive ? globalTimer.phase : (session?.phase ?? "prep");
  const phaseColor = PHASE_TONE[phase];
  const displayTimeLeft = globalTimer.isActive ? globalTimer.timeLeft : timeLeft;
  const timerText = formatTime(displayTimeLeft);

  const roundsSummary = setup ? `Rounds: ${setup.rounds}` : "Rounds: --";
  const setSummary = `SET ${globalTimer.setNumber} OF ${setup?.rounds ?? 4}`;
  const intervalSummary = `${globalTimer.workTime}s work • ${globalTimer.restTime}s rest`;

  const nextPhase: SessionPhase = phase === "prep" ? "work" : phase === "work" ? "rest" : phase === "rest" ? "work" : "complete";
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
      const phaseMessage = phase === "work" ? "Work. All in." : phase === "rest" ? "Rest and rotate." : phase === "prep" ? "Get ready." : "Workout complete.";
      speak(phaseMessage);
    }

    if (phase === "complete") return;
    if (displayTimeLeft <= 5 && displayTimeLeft > 0 && !countdownCallouts.current.has(displayTimeLeft)) {
      countdownCallouts.current.add(displayTimeLeft);
      speak(`${displayTimeLeft}`);
    }
  }, [phase, displayTimeLeft]);

  return (
    <main className={`${orbitron.variable} ${orbitron.className} relative flex min-h-screen w-screen items-center justify-center bg-black text-white px-6 py-10`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#202020,transparent_55%)]" />

      <div className="relative flex h-full w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-5xl font-extrabold uppercase md:text-7xl tracking-[0.2em]" style={{ color: "#F1EDE5" }}>AVLR</h1>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.35em]" style={{ color: hexToRgba(accentBrand, 0.7) }}>
            <span>{intervalSummary}</span>
            <span>•</span>
            <span>{setSummary}</span>
            <span>•</span>
            <span>{roundsSummary}</span>
          </div>
        </header>

        <div className="grid flex-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative flex flex-col items-center justify-center rounded-[24px] border-2 px-10 py-12 text-center"
            style={{ borderColor: phaseColor, backgroundColor: hexToRgba(phaseColor, 0.12), boxShadow: `0 0 55px ${hexToRgba(phaseColor, 0.25)}` }}>
            <p className="text-sm uppercase tracking-[0.45em]" style={{ color: phaseColor }}>
              {PHASE_LABEL[phase]} {phase !== 'change' && phase !== 'complete' && phase !== 'prep' ? `• SET ${globalTimer.setNumber} • STATION ${globalTimer.activeStationId}` : ''}
            </p>
            <p className="mt-8 text-[9rem] font-black leading-none tracking-[0.12em] md:text-[12rem]"
              style={{ color: phaseColor, textShadow: `0 0 55px ${hexToRgba(phaseColor, 0.35)}` }}>
              {timerText}
            </p>
            <p className="mt-6 text-sm uppercase tracking-[0.35em]" style={{ color: hexToRgba(accentBrand, 0.7) }}>
              Next: <span style={{ color: nextPhaseColor }}>{nextPhaseLabel}</span>
            </p>
          </div>

          <aside className="flex flex-col gap-6 rounded-[24px] border border-white/10 bg-black/60 px-6 py-8 backdrop-blur-md">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.4em] text-[#F1EDE5]">Custom Timer Settings</p>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-white/40 tracking-widest">Work Seconds</label>
                <input 
                  type="number" 
                  value={customWorkTime} 
                  onChange={(e) => setCustomWorkTime(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xl font-bold focus:outline-none focus:border-[#C8A871]/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-white/40 tracking-widest">Rest Seconds</label>
                <input 
                  type="number" 
                  value={customRestTime} 
                  onChange={(e) => setCustomRestTime(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xl font-bold focus:outline-none focus:border-[#C8A871]/50"
                />
              </div>

              <button 
                onClick={updateSettings}
                className="w-full bg-[#F1EDE5] text-black font-bold py-3 rounded-xl uppercase tracking-widest text-xs hover:bg-white transition-colors"
              >
                Sync & Reset Timer
              </button>
            </div>

            <div className="mt-auto space-y-2 text-[10px] uppercase tracking-[0.3em] text-white/30 border-t border-white/5 pt-6">
              <p>Active Station: {globalTimer.activeStationId}</p>
              <p>Set Progress: {globalTimer.setNumber} / {setup?.rounds ?? 4}</p>
              <p>{lastUpdated ? `Synced ${lastUpdated}` : "Syncing..."}</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
