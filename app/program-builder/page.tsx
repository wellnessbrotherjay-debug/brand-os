"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Orbitron, Outfit } from "next/font/google";
import { useVenueContext } from "@/lib/venue-context";
import { type BodyPart, type MovementType } from "@/lib/lib/exercise-library";
import CloudflarePlayer from "@/components/CloudflarePlayer";
import Link from "next/link";
import { DEFAULT_EXERCISE_MEDIA } from "@/lib/lib/exercise-library";
import { generateWorkoutPlan } from "@/lib/workout-engine/generator";
import { storage } from "@/lib/workout-engine/storage";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "700", "900"] });
const outfit = Outfit({ subsets: ["latin"], weight: ["400", "600", "800"] });

const GOALS = ["Fat Loss", "Strength", "Endurance"] as const;
type Goal = (typeof GOALS)[number];

/** Shape returned by /api/exercises */
interface SupabaseExercise {
  id: string;
  slug: string;
  name: string;
  type: string;
  tags: string[];
  demo_url: string | null;
  cues: string | null;
  body_part: string | null;
  movement_type: string | null;
  equipment: string | null;
}

interface StationExercise {
  stationId: number;
  name: string;
  video: string;
  equipment: string;
  muscles: string[];
  cues: string | string[];
  part: number;
}

interface WarmupMove {
  id: string;
  name: string;
  video: string;
}

interface ProgramDay {
  dayNumber: number;
  workoutName: string;
  goal: Goal;
  exercises: StationExercise[];
  warmup: WarmupMove[];
  warmupDuration: number;
  warmupRounds: number;
  warmupWorkTime: number;
  warmupRestTime: number;
  mainWorkTime: number;
  mainRestTime: number;
  mainRounds: number;
  studioMode: "studio-a" | "studio-b";
  stationCount: number;
  scheduledDate: string; // ISO date YYYY-MM-DD
  scheduledTime: string; // HH:MM
}

function hexToRgba(hex: string, alpha: number) {
  const s = hex.replace("#", "");
  if (s.length !== 6) return `rgba(255,255,255,${alpha})`;
  const n = parseInt(s, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function getDateForDay(startDate: string, dayOffset: number): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(iso: string): string {
  if (!iso) return "No Date";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const STATIONS = 6;

const BODY_PART_LABELS: Record<string, string> = {
  all: "View All",
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  arms: "Arms",
  legs: "Legs",
  core: "Core",
  "total body": "Full Body",
};

const EXERCISE_TYPES: Record<string, string> = {
  all: "Tutte",
  strength: "Forza",
  conditioning: "Conditioning",
  mobility: "Mobility",
  yoga: "Yoga",
  pilates: "Pilates",
};

export default function ProgramBuilderPage() {
  const { activeVenue } = useVenueContext();
  const brandColors = useMemo(
    () => activeVenue?.colors ?? { primary: "#121112", secondary: "#C8A871", accent: "#F1EDE5" },
    [activeVenue]
  );
  const { secondary: gold, accent } = brandColors;

  const [days, setDays] = useState<ProgramDay[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [programName, setProgramName] = useState("New Workout");
  const [isNameDirty, setIsNameDirty] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [savedProgramId, setSavedProgramId] = useState<string | null>(null);

  const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const createInitialDays = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      dayNumber: i + 1,
      workoutName: `Day ${i + 1}`,
      goal: "Fat Loss" as Goal,
      studioMode: "studio-a" as "studio-a" | "studio-b",
      exercises: [],
      warmup: [],
      warmupDuration: 6,
      warmupRounds: 1,
      warmupWorkTime: 60,
      warmupRestTime: 0,
      mainWorkTime: 45,
      mainRestTime: 15,
      mainRounds: 3,
      stationCount: 6,
      scheduledDate: getDateForDay(startDate, i),
      scheduledTime: "08:00"
    }));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pId = params.get("programId");
    if (pId) {
      setSavedProgramId(pId);
      fetch(`/api/programs/${pId}`)
        .then(r => r.json())
        .then(data => {
          if (data.name) setProgramName(data.name);
          if (data.program_days && Array.isArray(data.program_days)) {
            const loadedDays = data.program_days.map((d: any) => ({
              dayNumber: d.day_number,
              workoutName: d.workout_name,
              goal: d.goal as Goal,
              studioMode: d.studio_mode as "studio-a" | "studio-b",
              exercises: d.data?.exercises || [],
              warmup: d.data?.warmup || [],
              warmupDuration: d.data?.warmupDuration || 6,
              warmupRounds: d.data?.warmupRounds || 1,
              warmupWorkTime: d.data?.warmupWorkTime || d.data?.warmupMoveDuration || 60,
              warmupRestTime: d.data?.warmupRestTime || 0,
              scheduledDate: d.scheduled_date || d.data?.scheduledDate || "",
              scheduledTime: d.scheduled_time || d.data?.scheduledTime || "08:00",
            }));
            
            loadedDays.sort((a: any, b: any) => a.dayNumber - b.dayNumber);
            setDays(loadedDays);
            
            if (loadedDays[0]?.scheduledDate) {
              setStartDate(loadedDays[0].scheduledDate);
            }
          }
        });
    }
  }, []);

  const initNewProgram = (count: number) => {
    setDays(createInitialDays(count));
    setProgramName("New " + (count === 1 ? "Workout" : "Program"));
    setIsNameDirty(false);
    setSavedProgramId(null);
    setActiveDay(0);
  };

  useEffect(() => {
    if (days.length === 1) {
      setProgramName(days[0].workoutName);
      setIsNameDirty(false); // keep it synced
    }
  }, [days, isNameDirty]);

  useEffect(() => {
    if (days.length === 0) initNewProgram(10);
  }, []);

  const loadAllTemplates = async () => {
    const res = await fetch("/api/programs");
    const data = await res.json();
    setAvailablePrograms(data);
    setIsOpening(true);
  };

  const openTemplate = (prog: any) => {
    setProgramName(prog.name);
    setSavedProgramId(prog.id);
    const mappedDays = prog.program_days.sort((a: any, b: any) => a.day_number - b.day_number).map((d: any) => ({
       dayNumber: d.dayNumber || d.day_number,
       workoutName: d.workoutName || d.workout_name,
       exercises: d.data?.exercises || [],
       warmup: d.data?.warmup || [],
       warmupDuration: d.data?.warmupDuration || 6,
       warmupRounds: d.data?.warmupRounds || 1,
       warmupWorkTime: d.data?.warmupWorkTime || d.data?.warmupMoveDuration || 60,
       warmupRestTime: d.data?.warmupRestTime || 0,
       studioMode: d.data?.studioMode || "studio-a",
       goal: d.data?.goal || "Fat Loss",
       scheduledDate: d.scheduled_date || d.data?.scheduledDate || "",
    }));
    setDays(mappedDays);
    setIsOpening(false);
  };

  useEffect(() => {
    if (!startDate) return;
    setDays((prev) =>
      prev.map((d, i) => ({ ...d, scheduledDate: getDateForDay(startDate, i) }))
    );
  }, [startDate]);

  const legacyFallbackBase: SupabaseExercise[] = DEFAULT_EXERCISE_MEDIA.map((ex, i) => ({
    id: `legacy-${i}`,
    slug: ex.name.toLowerCase().replace(/\s+/g, '-'),
    name: ex.name,
    type: "strength",
    tags: ex.muscles || [],
    demo_url: ex.video,
    cues: ex.cues?.join('\n') || null,
    body_part: ex.bodyPart || null,
    movement_type: ex.movementType || null,
    equipment: ex.equipment || null
  }));

  const [allExercises, setAllExercises] = useState<SupabaseExercise[]>(legacyFallbackBase);
  const [libraryLoading, setLibraryLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exercises")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAllExercises(data);
        }
        setLibraryLoading(false);
      })
      .catch(err => {
        console.error("Failed to load library", err);
        setLibraryLoading(false);
      });
  }, []);

  const [saving, setSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const saveProgram = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      let programId = savedProgramId;
      // Default program name logic: Prefer day 1 name if program name is still default
      let finalName = programName;
      if (programName.startsWith("New ") && days[0]?.workoutName && days[0].workoutName !== "New Workout") {
        finalName = days[0].workoutName;
      }
      // If it's a 1-day standalone, always prioritize that workout name
      if (days.length === 1) finalName = days[0].workoutName;

      if (!programId) {
        const res = await fetch("/api/programs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: finalName, dayCount: days.length }),
        });
        const prog = await res.json();
        programId = prog.id;
        setSavedProgramId(programId);
      } else {
        await fetch(`/api/programs/${programId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: finalName }),
        });
      }

      await fetch(`/api/programs/${programId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: finalName, days: days.map(d => ({
          day_number: d.dayNumber,
          workout_name: d.workoutName,
          goal: d.goal,
          studio_mode: d.studioMode,
          warmup_work_time: d.warmupWorkTime,
          warmup_rest_time: d.warmupRestTime,
          scheduled_date: d.scheduledDate || null,
          scheduled_time: d.scheduledTime || null,
          data: {
             name: d.workoutName,
             goal: d.goal,
             studioMode: d.studioMode,
             stationCount: d.stationCount,
             mainWorkTime: d.mainWorkTime,
             mainRestTime: d.mainRestTime,
             mainRounds: d.mainRounds,
             exercises: d.exercises,
             warmup: d.warmup,
             warmupDuration: d.warmupDuration,
             warmupRounds: d.warmupRounds,
             warmupWorkTime: d.warmupWorkTime,
             warmupRestTime: d.warmupRestTime,
             scheduledDate: d.scheduledDate,
             scheduledTime: d.scheduledTime,
          },
        })) }),
      });

      if (!savedProgramId && programId) {
        window.history.pushState({}, "", `?programId=${programId}`);
      }
      setPushStatus("✅ Program saved!");
      setTimeout(() => setPushStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setPushStatus("❌ Save failed");
    } finally {
      setSaving(false);
    }
  }, [programName, days, savedProgramId, saving]);

  const deleteProgram = async (pId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await fetch(`/api/programs/${pId}`, { method: "DELETE" });
      setAvailablePrograms(prev => prev.filter(p => p.id !== pId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete program.");
    }
  };

  const pushDayToDisplays = useCallback(
    async (dayIndex: number) => {
      if (!savedProgramId) {
        setPushStatus("Save the program first");
        return;
      }
      try {
        const res = await fetch("/api/programs/auto-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ programId: savedProgramId, dayNumber: dayIndex + 1 }),
        });
        const result = await res.json();
        setPushStatus(result.ok ? `✅ Day ${dayIndex + 1} pushed to all displays!` : "❌ Push failed");
        setTimeout(() => setPushStatus(null), 4000);
      } catch {
        setPushStatus("❌ Push failed");
      }
    },
    [savedProgramId]
  );

  const currentDay = days[activeDay];

  const handleAiGenerate = async () => {
    if (isGenerating || !currentDay) return;
    setIsGenerating(true);
    try {
      const setup = storage.getSetup();
      if (!setup) {
         alert("Please complete the Setup console first to use AI generation.");
         return;
      }
      
      const sessionDate = new Date(currentDay.scheduledDate || new Date());
      const formattedLib = allExercises.map(ex => ({
         name: ex.name,
         video: ex.demo_url || "",
         equipment: ex.equipment || "",
         muscles: ex.body_part ? [ex.body_part] : [],
         cues: ex.cues || "",
         type: ex.type || "strength"
      }));

      const plan = generateWorkoutPlan(setup, formattedLib as any, sessionDate);
      
      const newExercises = plan.exercises.map(ex => {
        const libEx = allExercises.find(l => l.name === ex.name);
        return {
           stationId: ex.stationId,
           name: ex.name,
           video: ex.video || (libEx as any)?.demo_url || (libEx as any)?.video_url || "",
           equipment: ex.equipment || (libEx as any)?.equipment || (libEx as any)?.required_equipment || "",
           muscles: ex.muscles || ((libEx as any)?.body_part ? [(libEx as any).body_part] : (libEx as any)?.primary_muscle_group ? [(libEx as any).primary_muscle_group] : []),
           cues: ex.cues || (libEx as any)?.cues || "",
           part: ex.part || 0
        };
      });

      setDays(prev => prev.map((d, j) => 
        j === activeDay ? { ...d, workoutName: plan.name || d.workoutName, exercises: newExercises } : d
      ));
      
      setPushStatus("✨ AI Suggested a Routine!");
      setTimeout(() => setPushStatus(null), 3000);
    } catch (err) {
      console.error(err);
      alert("AI Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStation, setPickerStation] = useState(1);
  const [pickerType, setPickerType] = useState<'main' | 'warmup'>('main');
  const [pickerPart, setPickerPart] = useState(0);
  const [filterBodyPart, setFilterBodyPart] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [previewExercise, setPreviewExercise] = useState<SupabaseExercise | null>(null);

  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBodyPart = filterBodyPart === "all" || ex.body_part === filterBodyPart;
      const matchesType = filterType === "all" || ex.type === filterType;
      return matchesSearch && matchesBodyPart && matchesType;
    });
  }, [allExercises, searchQuery, filterBodyPart, filterType]);

  const addExerciseToStation = (ex: SupabaseExercise, stationId: number, part: number = 0) => {
    if (pickerType === 'warmup') {
       setDays(prev => prev.map((d, i) => {
         if (i !== activeDay) return d;
         const newWarmup = [...d.warmup];
         newWarmup[stationId - 1] = { id: ex.id, name: ex.name, video: ex.demo_url || "" };
         return { ...d, warmup: newWarmup };
       }));
    } else {
       setDays(prev => prev.map((d, i) => {
         if (i !== activeDay) return d;
         const newExs = d.exercises.filter(e => !(e.stationId === stationId && e.part === part));
         newExs.push({
           stationId,
           name: ex.name,
           video: ex.demo_url || "",
           equipment: ex.equipment || "",
           muscles: ex.body_part ? [ex.body_part] : [],
           cues: ex.cues || "",
           part
         });
         return { ...d, exercises: newExs };
       }));
    }
    setPickerOpen(false);
  };

  const removeExercise = (stationId: number, type: 'main' | 'warmup') => {
    setDays(prev => prev.map((d, i) => {
      if (i !== activeDay) return d;
      if (type === 'warmup') {
        const newWarmup = [...d.warmup];
        newWarmup[stationId - 1] = undefined as any;
        return { ...d, warmup: newWarmup.filter(Boolean) as any };
      } else {
        return { ...d, exercises: d.exercises.filter(e => e.stationId !== stationId) };
      }
    }));
  };

  if (!currentDay) return null;

  return (
    <div
      className={`${outfit.className} min-h-screen`}
      style={{ background: "#0f0f0f", color: accent }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b"
        style={{ background: "#0f0f0f", borderColor: hexToRgba(gold, 0.2) }}
      >
        <div className="flex items-center gap-4">
          <Link href="/program-builder/library" className="text-sm opacity-50 hover:opacity-100 transition-opacity">
            ← Library
          </Link>
          <div>
            <input
              value={programName}
              onChange={(e) => { setProgramName(e.target.value); setIsNameDirty(true); }}
              className={`${orbitron.className} text-xl font-bold bg-transparent border-none outline-none`}
              style={{ color: gold }}
            />
            <p className="text-xs opacity-40 mt-0.5">{days.length}-Day {days.length === 1 ? 'Standalone Workout' : 'Program Cycle'}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
             <button onClick={loadAllTemplates} className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-[10px] uppercase font-black tracking-widest hover:bg-white/10 transition-all opacity-60 hover:opacity-100">Open Template</button>
             <div className="flex border border-white/10 rounded overflow-hidden opacity-40 hover:opacity-100 transition-all">
                <button onClick={() => initNewProgram(1)} className="px-3 py-1.5 bg-white/5 text-[10px] uppercase font-black border-r border-white/10 hover:bg-white/10">New Single</button>
                <button onClick={() => initNewProgram(10)} className="px-3 py-1.5 bg-white/5 text-[10px] uppercase font-black hover:bg-white/10">New 10-Day</button>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           {pushStatus && (
              <span className={`${orbitron.className} text-[10px] font-black uppercase tracking-widest text-[#C8A871] mr-4 animate-pulse`}>{pushStatus}</span>
           )}
           <button 
             onClick={handleAiGenerate}
             disabled={isGenerating}
             className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#C29330] to-[#E8C27E] text-[#0f0f0f] text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
           >
             {isGenerating ? "GENERATING..." : <><span>✨</span> AI GENERATE</>}
           </button>
           <div className="flex items-center gap-2 ml-2">
             <label className="text-[10px] opacity-30 font-black uppercase tracking-widest">Start Date</label>
             <input
               type="date"
               value={startDate}
               onChange={(e) => setStartDate(e.target.value)}
               className="text-[10px] px-2 py-1.5 rounded bg-white/5 border border-white/10 outline-none text-white font-bold"
               style={{ borderColor: hexToRgba(gold, 0.2) }}
             />
           </div>
           <button
             onClick={saveProgram}
             disabled={saving}
             className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all"
             style={{ borderColor: gold, color: gold, opacity: saving ? 0.6 : 1 }}
           >
             {saving ? "Saving…" : `Save Template (${days.reduce((acc, d) => acc + (d.exercises?.length || 0), 0)})`}
           </button>
           {savedProgramId && (
             <button
               onClick={() => pushDayToDisplays(activeDay)}
               className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:scale-105"
               style={{ background: gold, color: "#0f0f0f" }}
             >
               Push Live →
             </button>
           )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-73px)]">
        {/* Day selection sidebar */}
        {days.length > 1 && (
          <div className="w-16 flex flex-col items-center py-6 border-r gap-3" style={{ background: "#111", borderColor: hexToRgba(gold, 0.1) }}>
            {days.map((day, i) => (
              <button key={i} onClick={() => setActiveDay(i)}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all relative group"
                style={{ 
                   background: activeDay === i ? gold : 'transparent',
                   color: activeDay === i ? "#0f0f0f" : gold,
                   border: `1px solid ${hexToRgba(gold, activeDay === i ? 1 : 0.2)}`
                }}>
                {i + 1}
                <div className="absolute left-14 px-2 py-1 bg-black border border-white/10 rounded text-[8px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Day {i + 1}: {day.workoutName}</div>
              </button>
            ))}
          </div>
        )}

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12">
          {/* Day Header */}
          <div className="max-w-4xl mx-auto flex items-end justify-between">
            <div className="flex-1">
               <span className={`${orbitron.className} text-[10px] font-black uppercase tracking-[0.4em] mb-2 block`} style={{ color: gold }}>Program Day {currentDay.dayNumber}</span>
               <div className="flex items-center gap-4">
                  <input
                    value={currentDay.workoutName}
                    onChange={(e) => setDays(prev => prev.map((d, i) => i === activeDay ? { ...d, workoutName: e.target.value } : d))}
                    className={`${orbitron.className} text-4xl font-black bg-transparent border-none outline-none w-full`}
                    style={{ color: accent }}
                  />
                  <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg border bg-white/5" style={{ borderColor: hexToRgba(gold, 0.1) }}>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Goal</span>
                    <select
                      value={currentDay.goal}
                      onChange={(e) => setDays(prev => prev.map((d, i) => i === activeDay ? { ...d, goal: e.target.value as Goal } : d))}
                      className="bg-transparent text-xs font-bold outline-none"
                      style={{ color: gold }}
                    >
                      {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
               </div>
               <div className="mt-4 flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest opacity-60">
                  <div className="relative group flex items-center gap-2 cursor-pointer">
                    <span>📅 {formatDisplayDate(currentDay.scheduledDate)}</span>
                    <input 
                      type="date" 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full" 
                      value={currentDay.scheduledDate}
                      onChange={(e) => setDays(prev => prev.map((d, i) => i === activeDay ? { ...d, scheduledDate: e.target.value } : d))}
                    />
                  </div>
                  <div className="relative group flex items-center gap-2 cursor-pointer">
                    <span>⏰ {currentDay.scheduledTime}</span>
                    <input 
                      type="time" 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full" 
                      value={currentDay.scheduledTime}
                      onChange={(e) => setDays(prev => prev.map((d, i) => i === activeDay ? { ...d, scheduledTime: e.target.value } : d))}
                    />
                  </div>
                  <span className="flex items-center gap-2">
                    ⏱️ {Math.round(
                      ((currentDay.warmupRounds * 6 * (currentDay.warmupWorkTime + currentDay.warmupRestTime)) + 
                      (currentDay.mainRounds * 6 * (currentDay.mainWorkTime + currentDay.mainRestTime)) + 
                      180) / 60
                    )} MINS EST.
                  </span>
                  <span className="flex items-center gap-2">📍 {currentDay.studioMode === 'studio-a' ? 'Studio A (Standard)' : 'Studio B (Circuit)'}</span>
               </div>
            </div>
          </div>

          {/* Configuration sections */}
          <div className="max-w-4xl mx-auto space-y-12 pb-24">
            
            {/* Warm-Up Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: hexToRgba(gold, 0.1) }}>
                <h3 className={`${orbitron.className} text-sm font-black tracking-[0.3em] uppercase`} style={{ color: gold }}>I. Transition & Warm-up</h3>
                <div className="flex items-center gap-6">
                   <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Move Time</span>
                      <select value={currentDay.warmupWorkTime} onChange={(e) => setDays(prev => prev.map((d, i) => i === activeDay ? { ...d, warmupWorkTime: Number(e.target.value) } : d))}
                        className="bg-transparent text-[10px] font-bold outline-none" style={{ color: gold }}>
                        {[30, 45, 60, 90].map(t => <option key={t} value={t}>{t}s</option>)}
                      </select>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Rounds</span>
                      <select value={currentDay.warmupRounds} onChange={(e) => setDays(prev => prev.map((d, i) => i === activeDay ? { ...d, warmupRounds: Number(e.target.value) } : d))}
                        className="bg-transparent text-[10px] font-bold outline-none" style={{ color: gold }}>
                        {[1, 2, 3].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3">
                {Array.from({ length: 6 }, (_, i) => i + 1).map((slotId) => {
                  const ex = currentDay.warmup[slotId - 1];
                  return (
                    <div key={`warmup-${slotId}`} className="rounded-lg border overflow-hidden transition-all"
                      style={{ border: `1px solid ${hexToRgba(gold, ex ? 0.3 : 0.1)}`, background: hexToRgba(gold, 0.02) }}>
                      <div className="px-2 py-1 text-[8px] font-bold flex justify-between items-center" style={{ background: hexToRgba(gold, 0.05), color: gold }}>
                        <span>MOVE {slotId}</span>
                        {ex && <button onClick={() => removeExercise(slotId, 'warmup')} className="text-[10px] text-red-500 hover:text-red-400">✕</button>}
                      </div>
                      {ex ? (
                        <div className="p-2 cursor-pointer group" onClick={() => { setPickerStation(slotId); setPickerType('warmup'); setPickerOpen(true); }}>
                          <p className="text-[10px] font-bold truncate leading-tight mb-1" style={{ color: accent }}>{ex.name}</p>
                          <div className="aspect-video rounded overflow-hidden">
                             <CloudflarePlayer videoId={ex.video || ""} muted autoPlay loop />
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setPickerStation(slotId); setPickerType('warmup'); setPickerOpen(true); }}
                          className="w-full py-6 text-xl flex items-center justify-center opacity-20 hover:opacity-100 transition-all">
                          +
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Workout Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: hexToRgba(gold, 0.1) }}>
                <h3 className={`${orbitron.className} text-sm font-black tracking-[0.3em] uppercase`} style={{ color: gold }}>II. Main Session</h3>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-1">
                       <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Work</span>
                       <select value={currentDay.mainWorkTime} onChange={(e) => setDays(prev => prev.map((d, i) => i === activeDay ? { ...d, mainWorkTime: Number(e.target.value) } : d))}
                         className="bg-transparent text-[10px] font-bold outline-none" style={{ color: gold }}>
                         {[30, 40, 45, 60, 90].map(t => <option key={t} value={t}>{t}s</option>)}
                       </select>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Rest</span>
                       <select value={currentDay.mainRestTime} onChange={(e) => setDays(prev => prev.map((d, i) => i === activeDay ? { ...d, mainRestTime: Number(e.target.value) } : d))}
                         className="bg-transparent text-[10px] font-bold outline-none" style={{ color: gold }}>
                         {[10, 15, 20, 30].map(t => <option key={t} value={t}>{t}s</option>)}
                       </select>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Rounds</span>
                       <select value={currentDay.mainRounds} onChange={(e) => setDays(prev => prev.map((d, i) => i === activeDay ? { ...d, mainRounds: Number(e.target.value) } : d))}
                         className="bg-transparent text-[10px] font-bold outline-none" style={{ color: gold }}>
                         {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                    </div>
                    {currentDay.studioMode === 'studio-b' && (
                      <div className="flex flex-col gap-1">
                         <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Stations</span>
                         <select value={currentDay.stationCount} onChange={(e) => setDays(prev => prev.map((d, i) => i === activeDay ? { ...d, stationCount: Number(e.target.value) } : d))}
                           className="bg-transparent text-[10px] font-bold outline-none" style={{ color: gold }}>
                           {[6, 7, 8, 9, 10, 11, 12].map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                      </div>
                    )}
                    <button onClick={() => setDays(prev => prev.map((d, i) => i === activeDay ? { ...d, studioMode: d.studioMode === 'studio-a' ? 'studio-b' : 'studio-a' } : d))}
                      className="ml-4 px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-widest transition-all"
                      style={{ borderColor: hexToRgba(gold, 0.3), color: gold, background: hexToRgba(gold, 0.05) }}>
                      Switch to {currentDay.studioMode === 'studio-a' ? 'Studio B' : 'Studio A'}
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {Array.from({ length: currentDay.stationCount || 6 }, (_, i) => i + 1).map((stationId) => {
                  const stationExs = currentDay.exercises.filter(e => e.stationId === stationId).sort((a,b) => a.part - b.part);
                  return (
                    <div key={`station-${stationId}`} className="rounded-xl border flex flex-col overflow-hidden transition-all group hover:scale-[1.02]"
                       style={{ borderColor: hexToRgba(gold, stationExs.length > 0 ? 0.4 : 0.1), background: "#111" }}>
                       
                       <div className="px-4 py-2 flex items-center justify-between border-b" style={{ borderColor: hexToRgba(gold, 0.1), background: hexToRgba(gold, 0.05) }}>
                          <span className={`${orbitron.className} text-[10px] font-black uppercase tracking-widest`} style={{ color: gold }}>Station {stationId}</span>
                          {stationExs.length > 0 && <button onClick={() => removeExercise(stationId, 'main')} className="text-[10px] text-red-500 hover:text-red-400">Clear</button>}
                       </div>

                       <div className="p-4 flex-1 flex flex-col justify-center gap-3">
                          {currentDay.studioMode === 'studio-a' ? (
                             stationExs.length > 0 ? (
                               stationExs.map((ex, idx) => (
                                 <div key={idx} className="space-y-2">
                                   <div className="flex items-center justify-between">
                                      <p className="text-xs font-bold" style={{ color: gold }}>{ex.name}</p>
                                      <span className="text-[8px] opacity-40">{ex.equipment}</span>
                                   </div>
                                   <div className="aspect-video rounded-lg overflow-hidden bg-black shadow-inner relative cursor-pointer" 
                                     onClick={() => { setPickerStation(stationId); setPickerType('main'); setPickerPart(0); setPickerOpen(true); }}>
                                      <CloudflarePlayer videoId={ex.video || ""} muted autoPlay loop />
                                   </div>
                                 </div>
                               ))
                             ) : (
                                <button onClick={() => { setPickerStation(stationId); setPickerType('main'); setPickerPart(0); setPickerOpen(true); }}
                                  className="w-full py-12 flex flex-col items-center justify-center gap-2 opacity-20 group-hover:opacity-100 transition-all">
                                  <span className="text-4xl font-light">+</span>
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add Move</span>
                                </button>
                             )
                          ) : (
                            <div className="grid grid-cols-2 gap-3 h-full">
                              {[0, 1].map(p => {
                                const ex = stationExs.find(e => e.part === p);
                                return (
                                  <div key={p} className="flex flex-col gap-2">
                                    <span className="text-[8px] font-black uppercase opacity-20 text-center">Move {p === 0 ? 'A' : 'B'}</span>
                                    {ex ? (
                                      <div className="space-y-2 cursor-pointer" onClick={() => { setPickerStation(stationId); setPickerType('main'); setPickerPart(p); setPickerOpen(true); }}>
                                        <p className="text-[8px] font-bold truncate text-center" style={{ color: gold }}>{ex.name}</p>
                                        <div className="aspect-square rounded-lg overflow-hidden bg-black shadow-inner relative">
                                           <CloudflarePlayer videoId={ex.video || ""} muted autoPlay loop />
                                        </div>
                                      </div>
                                    ) : (
                                      <button onClick={() => { setPickerStation(stationId); setPickerType('main'); setPickerPart(p); setPickerOpen(true); }}
                                         className="flex-1 aspect-square rounded-lg border border-dashed border-white/5 flex flex-col items-center justify-center opacity-20 hover:opacity-100 transition-all">
                                         <span className="text-2xl font-light">+</span>
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                       </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Template Browser Modal */}
      {isOpening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
           <div className="w-full max-w-2xl bg-[#0f0f0f] border rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ borderColor: hexToRgba(gold, 0.2) }}>
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: hexToRgba(gold, 0.1), background: hexToRgba(gold, 0.05) }}>
                 <h2 className={`${orbitron.className} text-sm font-black tracking-widest`} style={{ color: gold }}>Your Program Library</h2>
                 <button onClick={() => setIsOpening(false)} className="text-xl opacity-40 hover:opacity-100">✕</button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3">
                 {availablePrograms.length === 0 ? (
                    <div className="py-12 text-center opacity-30 text-sm">No saved programs found. Create your first one to see it here!</div>
                 ) : (
                    availablePrograms.map(p => (
                       <div key={p.id} className="group flex items-center justify-between p-4 rounded-xl border bg-white/5 hover:border-sky-500/50 transition-all cursor-pointer"
                          style={{ borderColor: hexToRgba(gold, 0.1) }}
                          onClick={() => openTemplate(p)}>
                          <div className="flex-1">
                             <p className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">{p.name || 'Untitled Program'}</p>
                             <div className="flex items-center gap-4 mt-1 text-[10px] font-bold uppercase tracking-widest opacity-40">
                                <span>{p.program_days?.length || 0} Days</span>
                                <span>Updated {new Date(p.updated_at).toLocaleDateString()}</span>
                             </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={(e) => { e.stopPropagation(); deleteProgram(p.id); }} className="p-2 border border-red-500/20 rounded hover:bg-red-500/10 transition-colors">🗑️</button>
                             <button className="px-3 py-2 bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-lg" style={{ background: gold, color: '#0f0f0f' }}>Open</button>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Exercise Picker Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/95 backdrop-blur-sm">
          <div className="w-full max-w-5xl h-[80vh] flex flex-col bg-[#0f0f0f] border-2 rounded-2xl overflow-hidden shadow-2xl" 
            style={{ borderColor: hexToRgba(gold, 0.3) }}>
            
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: hexToRgba(gold, 0.1), background: hexToRgba(gold, 0.05) }}>
               <div>
                  <h3 className={`${orbitron.className} text-sm font-black tracking-widest uppercase mb-1`} style={{ color: gold }}>Select Exercise</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Station {pickerStation} • {pickerType === 'warmup' ? 'Warmup' : 'Main Workout'}</p>
               </div>
               <div className="flex flex-1 max-w-sm mx-10">
                  <input 
                    autoFocus
                    placeholder="Search moves, equipment, muscles..."
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-sky-500/50 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               <button onClick={() => setPickerOpen(false)} className="px-4 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all" style={{ borderColor: hexToRgba(gold, 0.2) }}>
                  Cancel
               </button>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 border-b flex gap-4" style={{ borderColor: hexToRgba(gold, 0.1), background: "#111" }}>
               <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                 className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest outline-none" style={{ color: gold }}>
                 {Object.entries(EXERCISE_TYPES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
               </select>
               <select value={filterBodyPart} onChange={(e) => setFilterBodyPart(e.target.value)}
                 className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest outline-none" style={{ color: gold }}>
                 {Object.entries(BODY_PART_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
               </select>
            </div>

            <div className="flex flex-1 overflow-hidden">
               <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-4">
                  {libraryLoading ? (
                    <div className="col-span-3 py-20 text-center text-sm opacity-40">Loading digital library...</div>
                  ) : filteredExercises.length === 0 ? (
                    <div className="col-span-3 py-20 text-center text-sm opacity-40">No matching moves found. Try another search.</div>
                  ) : (
                    filteredExercises.map((ex) => (
                      <div key={ex.id} 
                        className="group relative flex flex-col p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-sky-500/40 transition-all cursor-pointer min-h-[80px] justify-center"
                        onMouseEnter={() => setPreviewExercise(ex)}
                        onClick={() => addExerciseToStation(ex, pickerStation, pickerPart)}>
                        <div className="flex flex-col gap-1">
                           <p className="text-xs font-black uppercase text-white group-hover:text-sky-300 transition-colors leading-tight">{ex.name}</p>
                           <div className="flex items-center gap-2 mt-1">
                              <span className="text-[8px] font-bold text-sky-400 uppercase tracking-widest">{ex.equipment || 'Bodyweight'}</span>
                              <span className="w-1 h-1 rounded-full bg-white/20"></span>
                              <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{ex.body_part || 'Full Body'}</span>
                           </div>
                        </div>
                        <button className="absolute top-2 right-2 w-6 h-6 rounded-full bg-sky-500 text-[#0f0f0f] text-xs font-black shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" style={{ background: gold }}>+</button>
                      </div>
                    ))
                  )}
               </div>

               {previewExercise && (
                 <div className="w-80 border-l p-6 flex flex-col gap-4 overflow-y-auto" style={{ borderColor: hexToRgba(gold, 0.1), background: "#0c0c0c" }}>
                    <h4 className={`${orbitron.className} text-xs font-black tracking-widest uppercase`} style={{ color: gold }}>Movement Preview</h4>
                    <div className="aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                       <CloudflarePlayer videoId={previewExercise.demo_url || ""} muted autoPlay loop />
                    </div>
                    <div>
                       <p className="text-xl font-black text-white">{previewExercise.name}</p>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-1" style={{ color: gold }}>{previewExercise.equipment || 'Bodyweight'}</p>
                    </div>
                    {previewExercise.cues && (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-40 block mb-2">Performance Cues</span>
                        <p className="text-xs opacity-70 leading-relaxed italic">"{previewExercise.cues}"</p>
                      </div>
                    )}
                    <button onClick={() => addExerciseToStation(previewExercise as any, pickerStation, pickerPart)} 
                      className="mt-auto py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all" 
                      style={{ background: gold, color: '#0f0f0f' }}>
                      Add to Station {pickerStation}{currentDay.studioMode === 'studio-b' ? ` (Move ${pickerPart === 0 ? 'A' : 'B'})` : ''}
                    </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
