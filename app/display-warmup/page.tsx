"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Orbitron, Outfit, Cormorant_Garamond } from "next/font/google";
import { storage, type WorkoutPlan, type StationExercise } from "@/lib/workout-engine/storage";
import { useVenueContext } from "@/lib/venue-context";
import Image from "next/image";
import CloudflarePlayer from "@/components/CloudflarePlayer";
import { supabase as supabaseClient } from "@/lib/supabaseClient";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-orbitron" });
const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "600"], variable: "--font-outfit" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], style: ['normal', 'italic'], variable: "--font-serif" });

const FontStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    .font-serif { font-family: var(--font-serif), serif; }
    .font-sans { font-family: var(--font-outfit), sans-serif; }
    .font-accent { font-family: var(--font-orbitron), sans-serif; }

    .bg-studio-cream {
      background-color: #F8F6F0;
      background-image: radial-gradient(circle at 50% 0%, #FFFFFF 0%, #F8F6F0 60%, #EBE6DC 100%);
    }

    .text-gold-foil {
      background-image: linear-gradient(135deg, #AA7D39 0%, #E8D3A2 30%, #C69C50 50%, #E8D3A2 70%, #8A5F20 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
      animation: foilShine 6s linear infinite;
    }

    @keyframes foilShine { to { background-position: 200% center; } }
  `}} />
);

const AvrlLogo = () => (
  <div className="flex flex-col items-start">
    <div className="flex items-center gap-3 mb-1">
      <img src="/logos/global-avrl-logo.png" alt="AVRL Logo" className="h-14 object-contain" />
    </div>
    <div className="h-[1px] w-24 bg-gradient-to-r from-[#AA7D39] to-transparent opacity-40"></div>
  </div>
);

export default function WarmupDisplay() {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [remainingTime, setRemainingTime] = useState(60);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'work' | 'rest'>('work');
  const [currentRound, setCurrentRound] = useState(1);
  const [localTime, setLocalTime] = useState("");
  const [enabled, setEnabled] = useState(true); // Instant auto-play for studio TVs
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen support
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => {
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const startStudio = () => {
    setEnabled(true);
    toggleFullscreen();
  };

  const { activeVenue } = useVenueContext();

  // Load from schedule or fallback active
  useEffect(() => {
    const syncWithSchedule = async () => {
       const today = new Date().toISOString().split("T")[0];
       const now = new Date();
       const currentTimeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS
       
       const { data: scheduleData } = await (supabaseClient as any)
         .from('schedules')
         .select(`*, program:programs(id, name, program_days(data))`)
         .eq('scheduled_day', today)
         .lte('start_time', currentTimeStr)
         .eq('studio_id', 'studio-b')
         .order('start_time', { ascending: false })
         .limit(1)
         .single();

       const castSchedule = scheduleData as any;
       if (castSchedule && castSchedule.program?.program_days?.[0]?.data) {
          // If we have a timed session right now
          setPlan(castSchedule.program.program_days[0].data as WorkoutPlan);
       } else {
          // Fallback to active daily workout
          const { data: active } = await (supabaseClient as any)
            .from('workouts')
            .select('*')
            .eq('id', 'active')
            .single();
          if ((active as any)?.data) setPlan((active as any).data as WorkoutPlan);
       }
    };

    syncWithSchedule();
    const tick = setInterval(syncWithSchedule, 60000); // Check every minute
    
    const channel = supabaseClient
      .channel('schedule-update')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
         syncWithSchedule();
      })
      .subscribe();

    return () => {
       clearInterval(tick);
       supabaseClient.removeChannel(channel);
    };
  }, []);

  // Sync clock
  useEffect(() => {
    const tick = () => setLocalTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    tick();
    const inv = setInterval(tick, 1000);
    return () => clearInterval(inv);
  }, []);

  // Audio & Voice Sync Logic
  useEffect(() => {
    if (!enabled) return;
    
    const speak = (text: string) => {
      try {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        
        // Try to find a natural female voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          (v.name.includes('Samantha') || v.name.includes('Siri') || v.name.includes('Natural') || v.name.includes('Female')) && v.lang.includes('en')
        ) || voices.find(v => v.lang.includes('en'));

        if (preferredVoice) msg.voice = preferredVoice;
        
        msg.rate = 0.9; // Slightly slower for natural feel
        msg.pitch = 1.05; // Slightly higher for a softer feel
        window.speechSynthesis.speak(msg);
      } catch (e) {
        console.error("Speech failed", e);
      }
    };

    const playBeep = (freq: number, duration: number, xType: 'sine'|'square'|'sawtooth'|'triangle' = 'sine') => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = xType;
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
      } catch (e) {
        console.error("Audio failed", e);
      }
    };

    if (remainingTime <= 3 && remainingTime > 0) {
      playBeep(440, 0.1);
      speak(remainingTime.toString());
    } else if (remainingTime === 0) {
      const type = currentPhase === 'work' ? 'square' : 'sine';
      playBeep(currentPhase === 'work' ? 880 : 554, 0.4, type as any);
      speak(currentPhase === 'work' ? "Recovery" : "Go"); // Changed to Recovery/Go for more natural coaching
    }
  }, [remainingTime, enabled, currentPhase]);

  // Rounds, Work, Rest timing logic
  useEffect(() => {
    const calc = () => {
      if (!plan) return;
      const now = new Date();
      const secondsToday = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
      
      const workTime = (plan as any).warmupWorkTime || 60;
      const restTime = (plan as any).warmupRestTime || 0;
      const rounds = (plan as any).warmupRounds || 1;
      const totalMoves = plan.warmup?.length || 6;
      
      const moveCycle = workTime + restTime;
      const roundCycle = moveCycle * totalMoves;
      const totalCycle = roundCycle * rounds;
      
      const timeInTotalCycle = secondsToday % totalCycle;
      const roundIndex = Math.floor(timeInTotalCycle / roundCycle);
      const timeInRound = timeInTotalCycle % roundCycle;
      
      const moveIndex = Math.floor(timeInRound / moveCycle);
      const timeInMove = timeInRound % moveCycle;
      
      const phase = timeInMove < workTime ? 'work' : 'rest';
      const timeLeft = phase === 'work' ? workTime - timeInMove : moveCycle - timeInMove;
      
      setCurrentRound(roundIndex + 1);
      setCurrentMoveIndex(moveIndex >= totalMoves ? 0 : moveIndex);
      setCurrentPhase(phase);
      setRemainingTime(Math.ceil(timeLeft));
    };
    calc();
    const inv = setInterval(calc, 200);
    return () => clearInterval(inv);
  }, [plan]);

  const warmupMoves = useMemo(() => {
    if (plan?.warmup?.length) return plan.warmup;
    return Array.from({ length: 6 }).map((_, i) => ({
      stationId: i + 1,
      name: `Exequte Move ${i + 1}`,
      video: null,
      equipment: "Bodyweight",
      cues: "Control the movement"
    }));
  }, [plan]);

  if (!plan) {
    return (
      <div className="min-h-screen bg-studio-cream flex items-center justify-center">
         <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-[#C8A871] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-accent text-xs font-black tracking-[0.5em] text-[#8A5F20] opacity-40 uppercase">Syncing Warmup...</p>
         </div>
      </div>
    );
  }

  const currentMove = warmupMoves[currentMoveIndex];
  const realNextMove = warmupMoves[(currentMoveIndex + 1) % warmupMoves.length];

  return (
    <div className={`h-screen max-h-screen w-full bg-studio-cream text-[#2d2d2d] ${outfit.variable} ${orbitron.className} font-sans flex flex-col p-8 overflow-hidden relative`}>
      <FontStyles />

      {/* REFINED HEADER */}
      <div className="w-full flex justify-between items-end relative z-30 mb-8 px-4 shrink-0">
         <div className="flex flex-col gap-2">
            <AvrlLogo />
            <h1 className="font-serif text-5xl text-[#2D2D2D] italic font-light leading-none tracking-tight">
              {plan?.name || "The Daily Routine"}
            </h1>
         </div>
         <div className="flex flex-col items-end">
            <span className="font-accent text-[10px] font-black text-[#898989] tracking-[0.4em] uppercase mb-1">Local Time</span>
            <span className="font-serif text-5xl italic text-[#2D2D2D] tabular-nums">{localTime}</span>
         </div>
      </div>

      {/* CORE DISPLAY ENGINE */}
      <div className="flex-1 w-full flex items-center justify-between gap-12 px-4 relative z-20 min-h-0 mb-8">
        
        {/* PROGRESSIVE MOVE LIST */}
        <div className="flex-1 flex flex-col items-start justify-center h-full min-w-0">
            <div className="mb-10 w-full">
               <span className={`font-accent text-[11px] font-black tracking-[0.6em] uppercase mb-4 block transition-colors ${currentPhase === 'work' ? 'text-[#AA7D39]' : 'text-[#8B8B8B]'}`}>
                 {currentPhase === 'work' ? 'Functional Phase' : 'Recovery Phase'}
               </span>
               <h2 className="font-serif text-6xl lg:text-7xl text-[#2D2D2D] italic font-black leading-tight max-w-full break-words">
                 {currentPhase === 'work' ? currentMove.name : "Relax"}
               </h2>
            </div>

            <div className="flex flex-col gap-5 w-full">
              {warmupMoves.map((move, i) => {
                const isActive = i === currentMoveIndex;
                return (
                  <div key={i} className={`flex items-baseline gap-4 transition-all duration-1000 ${isActive ? 'translate-x-4 opacity-100 scale-105' : 'opacity-10 scale-95'}`}>
                    <span className="font-accent text-[10px] font-black text-[#AA7D39] w-12 tracking-widest shrink-0 uppercase">Move {i+1}</span>
                    <p className={`font-serif text-2xl lg:text-3xl italic transition-all leading-none ${isActive ? 'text-[#2D2D2D] font-bold underline decoration-[#AA7D39]/30 underline-offset-8' : 'text-[#6B6B6B]'}`}>
                      {move.name}
                    </p>
                  </div>
                );
              })}
            </div>
        </div>

        {/* CINEMATIC VIEWPOINT */}
        <div className="flex-[1.5] flex items-center justify-center relative h-full min-w-0 px-8">
           <div className="relative aspect-[4/5] h-full max-h-[600px] rounded-[3.5rem] overflow-hidden border-[8px] border-white shadow-[0_40px_80px_rgba(0,0,0,0.15)] ring-[20px] ring-white/10 transition-all duration-1000 ease-in-out">
              {currentPhase === 'work' ? (
                <CloudflarePlayer 
                  videoId={currentMove.video || ""} 
                  autoPlay 
                  loop 
                  muted 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#EBE6DC] flex flex-col items-center justify-center relative p-8 text-center min-w-0">
                   <div className="relative z-20 w-full mb-6">
                      <span className="font-accent text-[10px] font-black tracking-[1em] text-[#8A5F20] uppercase mb-4 opacity-60 block">Get Ready For</span>
                      <h3 className="font-serif text-5xl text-[#2D2D2D] italic font-black leading-tight line-clamp-2">{realNextMove.name}</h3>
                   </div>
                   <div className="w-full h-full absolute inset-0 opacity-10 blur-sm scale-110">
                      <CloudflarePlayer videoId={realNextMove.video || ""} autoPlay loop muted className="w-full h-full object-cover" />
                   </div>
                   <div className="w-[80%] aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white relative z-30 scale-105">
                      <CloudflarePlayer videoId={realNextMove.video || ""} autoPlay loop muted className="w-full h-full object-cover" />
                   </div>
                </div>
              )}
           </div>
        </div>

        {/* BIOCIRCUIT TIMER */}
        <div className="flex-1 flex flex-col items-end justify-center h-full gap-12 min-w-0">
            <div className="p-8 rounded-[2.5rem] bg-white shadow-xl border border-white/50 backdrop-blur-md w-full max-w-[340px]">
               <div className="flex flex-col gap-6">
                  <div>
                    <span className="font-accent text-[9px] font-black text-[#8A5F20] tracking-widest opacity-60 uppercase mb-2 block">Protocol</span>
                    <div className="flex items-center justify-between">
                       <div className="flex flex-col">
                          <span className="font-serif text-3xl italic text-[#2D2D2D]">{(plan as any).warmupWorkTime || 60}s</span>
                          <span className="font-accent text-[8px] text-[#AA7D39] font-black">WORK</span>
                       </div>
                       <div className="w-[1px] h-8 bg-black/5"></div>
                       <div className="flex flex-col items-end">
                          <span className="font-serif text-3xl italic text-[#2D2D2D]">{(plan as any).warmupRestTime || 0}s</span>
                          <span className="font-accent text-[8px] text-[#8B8B8B] font-black uppercase">Rest</span>
                       </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-black/5 flex justify-between items-center">
                    <span className="font-accent text-[10px] font-black text-[#8A5F20] tracking-widest opacity-60 uppercase">Session Status</span>
                    <span className="font-serif text-2xl italic text-[#2D2D2D]">{currentRound} / {(plan as any)?.warmupRounds || 1} RNDS</span>
                  </div>
               </div>
            </div>

            <div className="relative w-[340px] h-[340px] flex items-center justify-center">
               <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-lg">
                  <circle cx="170" cy="170" r="160" stroke="#EBE6DC" strokeWidth="2" fill="transparent" />
                  <circle cx="170" cy="170" r="160" stroke={currentPhase === 'work' ? "#AA7D39" : "#8B8B8B"} strokeWidth={currentPhase === 'work' ? "10" : "4"} fill="transparent" 
                    strokeDasharray={2 * Math.PI * 160}
                    strokeDashoffset={2 * Math.PI * 160 * (1 - remainingTime / (currentPhase === 'work' ? (plan as any).warmupWorkTime || 60 : (plan as any).warmupRestTime || 10))}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
               </svg>
               <div className="flex flex-col items-center">
                  <span className={`font-serif text-[12rem] leading-none font-light tabular-nums tracking-tighter drop-shadow-xl transition-colors duration-700 ${currentPhase === 'work' ? 'text-gold-foil' : 'text-[#8B8B8B]'}`}>
                    {remainingTime}
                  </span>
                  <span className={`font-accent text-xl font-black tracking-[1em] uppercase -mt-4 transition-all duration-700 ${currentPhase === 'work' ? 'text-[#AA7D39] animate-pulse' : 'text-[#8B8B8B]'}`}>
                    {currentPhase === 'work' ? 'WORK' : 'REST'}
                  </span>
               </div>
            </div>
        </div>
      </div>

      {/* HORIZONTAL STATION TRACKER */}
      <div className="w-full shrink-0 pt-8 border-t border-black/5 relative z-40">
        <div className="flex justify-between items-start gap-6 px-4">
          {warmupMoves.map((move, i) => {
            const isActive = i === currentMoveIndex;
            return (
              <div key={i} className={`flex-1 flex flex-col items-center gap-4 transition-all duration-700 ${isActive ? 'scale-110 -translate-y-10' : 'translate-y-0 opacity-40'}`}>
                <div className={`relative aspect-[3/4] w-full max-w-[160px] rounded-[2rem] overflow-hidden border-2 transition-all duration-700 shadow-xl ${isActive ? 'border-[#AA7D39] ring-[10px] ring-[#AA7D39]/10' : 'border-[#EBE6DC]'}`}>
                   {move.video && enabled ? (
                     <CloudflarePlayer 
                        videoId={move.video || ""} 
                        autoPlay 
                        loop 
                        muted 
                        className="w-full h-full object-cover"
                     />
                   ) : (
                     <div className="w-full h-full bg-[#EBE6DC] flex items-center justify-center p-4">
                        <span className="font-accent text-[8px] text-[#8A5F20] text-center uppercase tracking-widest break-words leading-tight">{move.name}</span>
                     </div>
                   )}
                </div>
                <div className="flex flex-col items-center text-center px-1">
                  <span className={`font-accent text-[8px] font-black tracking-widest uppercase mb-1 ${isActive ? 'text-[#AA7D39]' : 'text-[#8B8B8B]'}`}>Move {i+1}</span>
                  <p className={`text-[11px] font-serif italic font-bold leading-tight text-[#2D2D2D] line-clamp-2`}>
                    {move.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={toggleFullscreen} className="absolute bottom-6 right-6 p-4 rounded-full bg-white/40 backdrop-blur-lg border border-black/5 text-[#8A5F20] hover:bg-white hover:shadow-2xl transition-all z-[100] opacity-20 hover:opacity-100">
         {isFullscreen ? (
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
         ) : (
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
         )}
      </button>
    </div>
  );
}
