"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Orbitron, Outfit } from "next/font/google";
import { useVenueContext } from "@/lib/venue-context";
import { type BodyPart, type MovementType } from "@/lib/lib/exercise-library";
import CloudflarePlayer from "@/components/CloudflarePlayer";
import Link from "next/link";

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
  cues?: string | null;
  body_part?: BodyPart | null;
  movement_type?: MovementType | null;
  equipment?: string | null;
}

const BODY_PART_LABELS: Record<BodyPart | "all", string> = {
  all: "All",
  upper: "Upper Body",
  lower: "Lower Body",
  core: "Core",
  full_body: "Full Body",
};

const MOVEMENT_LABELS: Record<MovementType | "all", string> = {
  all: "All",
  push: "Push",
  pull: "Pull",
  hinge: "Hinge",
  squat: "Squat",
  carry: "Carry",
  cardio: "Cardio",
};

const EXERCISE_TYPES: Record<string, string> = {
  all: "All Types",
  strength: "Strength",
  mobility: "Mobility",
  yoga: "Yoga",
  pilates: "Pilates",
  conditioning: "Conditioning",
};

interface DayExercise {
  stationId: number;
  name: string;
  video?: string | null;
  equipment?: string | null;
  muscles?: string[];
  cues?: string | null;
  bodyPart?: BodyPart | null;
  movementType?: MovementType | null;
  exerciseType?: string;
}

interface ProgramDay {
  dayNumber: number;
  workoutName: string;
  goal: Goal;
  exercises: DayExercise[];
  scheduledDate: string; // ISO date YYYY-MM-DD
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
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const STATIONS = 6;

export default function ProgramBuilderPage() {
  const { activeVenue } = useVenueContext();
  const brandColors = useMemo(
    () => activeVenue?.colors ?? { primary: "#121112", secondary: "#C8A871", accent: "#F1EDE5" },
    [activeVenue]
  );
  const { secondary: gold, accent } = brandColors;

  // ── Program meta ──────────────────────────────────────────────────────────
  const [programName, setProgramName] = useState("10-Day Program");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);

  // ── 10 days ───────────────────────────────────────────────────────────────
  const [days, setDays] = useState<ProgramDay[]>(() =>
    Array.from({ length: 10 }, (_, i) => ({
      dayNumber: i + 1,
      workoutName: `Day ${i + 1}`,
      goal: "Fat Loss" as Goal,
      exercises: [],
      scheduledDate: getDateForDay(new Date().toISOString().split("T")[0], i),
    }))
  );

  const [activeDay, setActiveDay] = useState(0); // index 0-9

  // Update all scheduled dates when startDate changes
  useEffect(() => {
    setDays((prev) =>
      prev.map((d, i) => ({ ...d, scheduledDate: getDateForDay(startDate, i) }))
    );
  }, [startDate]);

  // ── Exercise library (loaded from Supabase) ───────────────────────────────
  const [allExercises, setAllExercises] = useState<SupabaseExercise[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLibraryLoading(true);
    fetch("/api/exercises")
      .then((r) => r.json())
      .then((data: SupabaseExercise[]) => {
        setAllExercises(Array.isArray(data) ? data : []);
      })
      .catch(() => setAllExercises([]))
      .finally(() => setLibraryLoading(false));
  }, []);

  // Derive available filter options from loaded exercises
  const availableEquipment = useMemo(() => {
    const set = new Set<string>();
    allExercises.forEach((ex) => { if (ex.equipment) set.add(ex.equipment); });
    return Array.from(set).sort();
  }, [allExercises]);

  // ── Exercise picker ───────────────────────────────────────────────────────
  const [filterBodyPart, setFilterBodyPart] = useState<BodyPart | "all">("all");
  const [filterMovement, setFilterMovement] = useState<MovementType | "all">("all");
  const [filterEquipment, setFilterEquipment] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [previewExercise, setPreviewExercise] = useState<SupabaseExercise | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStation, setPickerStation] = useState<number>(1);

  const filteredExercises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allExercises.filter((ex) => {
      if (filterBodyPart !== "all" && ex.body_part !== filterBodyPart) return false;
      if (filterMovement !== "all" && ex.movement_type !== filterMovement) return false;
      if (filterEquipment !== "all" && ex.equipment !== filterEquipment) return false;
      if (filterType !== "all" && ex.type !== filterType) return false;
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allExercises, filterBodyPart, filterMovement, filterEquipment, filterType, searchQuery]);

  // ── Day mutations ─────────────────────────────────────────────────────────
  const updateDay = useCallback(
    <K extends keyof ProgramDay>(field: K, value: ProgramDay[K]) => {
      setDays((prev) =>
        prev.map((d, i) => (i === activeDay ? { ...d, [field]: value } : d))
      );
    },
    [activeDay]
  );

  const addExerciseToStation = useCallback(
    (ex: SupabaseExercise, stationId: number) => {
      setDays((prev) =>
        prev.map((d, i) => {
          if (i !== activeDay) return d;
          const existing = d.exercises.filter((e) => e.stationId !== stationId);
          return {
            ...d,
            exercises: [
              ...existing,
              {
                stationId,
                name: ex.name,
                video: ex.demo_url,
                equipment: ex.equipment ?? null,
                muscles: ex.tags ?? [],
                cues: ex.cues ?? null,
                bodyPart: ex.body_part ?? null,
                movementType: ex.movement_type ?? null,
                exerciseType: ex.type,
              },
            ].sort((a, b) => a.stationId - b.stationId),
          };
        })
      );
      setPickerOpen(false);
      setPreviewExercise(null);
    },
    [activeDay]
  );

  const removeExercise = useCallback(
    (stationId: number) => {
      setDays((prev) =>
        prev.map((d, i) =>
          i !== activeDay
            ? d
            : { ...d, exercises: d.exercises.filter((e) => e.stationId !== stationId) }
        )
      );
    },
    [activeDay]
  );

  // ── Save & push ───────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [savedProgramId, setSavedProgramId] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const saveProgram = useCallback(async () => {
    setSaving(true);
    try {
      let programId = savedProgramId;

      if (!programId) {
        // Create new program
        const res = await fetch("/api/programs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: programName }),
        });
        const prog = await res.json();
        programId = prog.id;
        setSavedProgramId(programId);
      } else {
        // Update program name
        await fetch(`/api/programs/${programId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: programName }),
        });
      }

      // Save all 10 days
      await Promise.all(
        days.map((day) =>
          fetch(`/api/programs/${programId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              day_number: day.dayNumber,
              workout_name: day.workoutName,
              goal: day.goal,
              studio_mode: "studio-a",
              data: {
                name: day.workoutName,
                goal: day.goal,
                studioMode: "studio-a",
                exercises: day.exercises,
                scheduledDate: day.scheduledDate,
              },
              scheduled_date: day.scheduledDate || null,
            }),
          })
        )
      );

      setPushStatus("✅ Program saved!");
      setTimeout(() => setPushStatus(null), 3000);
    } catch {
      setPushStatus("❌ Save failed");
    } finally {
      setSaving(false);
    }
  }, [programName, days, savedProgramId]);

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

  // ── Render ────────────────────────────────────────────────────────────────
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
          <Link href="/builder" className="text-sm opacity-50 hover:opacity-100 transition-opacity">
            ← Builder
          </Link>
          <div>
            <input
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className={`${orbitron.className} text-xl font-bold bg-transparent border-none outline-none`}
              style={{ color: gold }}
            />
            <p className="text-xs opacity-40 mt-0.5">10-Day Program Builder</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {pushStatus && (
            <span className="text-sm px-3 py-1 rounded-full" style={{ background: hexToRgba(gold, 0.15), color: gold }}>
              {pushStatus}
            </span>
          )}
          <div className="flex items-center gap-2">
            <label className="text-xs opacity-50">Start</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm px-2 py-1 rounded"
              style={{ background: hexToRgba(gold, 0.1), color: accent, border: `1px solid ${hexToRgba(gold, 0.3)}` }}
            />
          </div>
          <button
            onClick={saveProgram}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{ background: gold, color: "#0f0f0f", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : savedProgramId ? "Save Changes" : "Save Program"}
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* ── Left: Day selector ─────────────────────────────────────────── */}
        <div
          className="w-52 flex-shrink-0 overflow-y-auto border-r"
          style={{ borderColor: hexToRgba(gold, 0.15) }}
        >
          {days.map((day, i) => {
            const isActive = i === activeDay;
            const filled = day.exercises.length;
            return (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className="w-full text-left px-4 py-3 border-b transition-all"
                style={{
                  borderColor: hexToRgba(gold, 0.1),
                  background: isActive ? hexToRgba(gold, 0.12) : "transparent",
                  borderLeft: isActive ? `3px solid ${gold}` : "3px solid transparent",
                }}
              >
                <div
                  className={`${orbitron.className} text-xs font-bold`}
                  style={{ color: isActive ? gold : hexToRgba(accent, 0.6) }}
                >
                  DAY {day.dayNumber}
                </div>
                <div className="text-xs opacity-50 mt-0.5">{formatDisplayDate(day.scheduledDate)}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: STATIONS }).map((_, s) => (
                      <div
                        key={s}
                        className="w-2 h-2 rounded-sm"
                        style={{
                          background: day.exercises.find((e) => e.stationId === s + 1)
                            ? gold
                            : hexToRgba(gold, 0.15),
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs opacity-40">{filled}/{STATIONS}</span>
                </div>
                {savedProgramId && filled === STATIONS && (
                  <button
                    onClick={(e) => { e.stopPropagation(); pushDayToDisplays(i); }}
                    className="mt-1.5 text-xs px-2 py-0.5 rounded w-full text-center font-bold transition-all"
                    style={{ background: hexToRgba(gold, 0.2), color: gold }}
                  >
                    Push Live
                  </button>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Center: Day editor ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Day header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <input
                value={currentDay.workoutName}
                onChange={(e) => updateDay("workoutName", e.target.value)}
                className={`${orbitron.className} text-2xl font-bold bg-transparent outline-none`}
                style={{ color: gold }}
              />
              <p className="text-sm opacity-40 mt-1">{formatDisplayDate(currentDay.scheduledDate)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-50">Goal</span>
              {GOALS.map((g) => (
                <button
                  key={g}
                  onClick={() => updateDay("goal", g)}
                  className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: currentDay.goal === g ? gold : hexToRgba(gold, 0.1),
                    color: currentDay.goal === g ? "#0f0f0f" : hexToRgba(accent, 0.7),
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Station grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: STATIONS }, (_, i) => i + 1).map((stationId) => {
              const ex = currentDay.exercises.find((e) => e.stationId === stationId);
              return (
                <div
                  key={stationId}
                  className="rounded-xl overflow-hidden border"
                  style={{
                    border: `1px solid ${hexToRgba(gold, ex ? 0.4 : 0.15)}`,
                    background: hexToRgba(gold, 0.03),
                  }}
                >
                  {/* Station label */}
                  <div
                    className={`${orbitron.className} px-3 py-2 flex items-center justify-between text-xs font-bold`}
                    style={{ background: hexToRgba(gold, 0.08), color: gold }}
                  >
                    <span>STATION {stationId}</span>
                    {ex && (
                      <button
                        onClick={() => removeExercise(stationId)}
                        className="text-xs opacity-50 hover:opacity-100"
                        style={{ color: "#ff4444" }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {ex ? (
                    <div>
                      {/* Video preview */}
                      <div className="aspect-video bg-black">
                        {ex.video && (
                          <CloudflarePlayer
                            videoId={ex.video}
                            muted
                            loop
                            autoPlay
                            controls={false}
                          />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-bold text-sm" style={{ color: accent }}>
                          {ex.name}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {ex.equipment && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: hexToRgba(gold, 0.12), color: gold }}
                            >
                              {ex.equipment}
                            </span>
                          )}
                          {ex.bodyPart && (
                            <span className="text-xs px-2 py-0.5 rounded-full opacity-60"
                              style={{ background: hexToRgba(accent, 0.08) }}>
                              {BODY_PART_LABELS[ex.bodyPart]}
                            </span>
                          )}
                          {ex.movementType && (
                            <span className="text-xs px-2 py-0.5 rounded-full opacity-60"
                              style={{ background: hexToRgba(accent, 0.08) }}>
                              {MOVEMENT_LABELS[ex.movementType]}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => { setPickerStation(stationId); setPickerOpen(true); }}
                          className="mt-2 text-xs opacity-40 hover:opacity-80 transition-opacity"
                        >
                          Change →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setPickerStation(stationId); setPickerOpen(true); }}
                      className="w-full flex flex-col items-center justify-center py-10 gap-2 transition-all hover:opacity-80"
                      style={{ color: hexToRgba(gold, 0.5) }}
                    >
                      <span className="text-2xl">+</span>
                      <span className="text-xs">Add Exercise</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary strip */}
          {currentDay.exercises.length > 0 && (
            <div
              className="mt-6 rounded-xl p-4 flex items-center justify-between"
              style={{ background: hexToRgba(gold, 0.06), border: `1px solid ${hexToRgba(gold, 0.15)}` }}
            >
              <div>
                <p className="text-sm font-bold" style={{ color: gold }}>
                  {currentDay.exercises.length}/{STATIONS} stations filled
                </p>
                <p className="text-xs opacity-50 mt-0.5">
                  {[...new Set(currentDay.exercises.map((e) => e.bodyPart).filter(Boolean))].map(
                    (bp) => BODY_PART_LABELS[bp as BodyPart]
                  ).join(" · ")}
                </p>
              </div>
              {savedProgramId && currentDay.exercises.length === STATIONS && (
                <button
                  onClick={() => pushDayToDisplays(activeDay)}
                  className="px-4 py-2 rounded-lg text-sm font-bold"
                  style={{ background: gold, color: "#0f0f0f" }}
                >
                  Push Day {currentDay.dayNumber} Live →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Exercise Picker Modal ────────────────────────────────────────── */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/70" onClick={() => { setPickerOpen(false); setPreviewExercise(null); }} />

          {/* Panel */}
          <div
            className="relative ml-auto w-full max-w-2xl h-full flex flex-col overflow-hidden"
            style={{ background: "#141414", borderLeft: `1px solid ${hexToRgba(gold, 0.2)}` }}
          >
            {/* Picker header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: hexToRgba(gold, 0.15) }}>
              <div>
                <p className={`${orbitron.className} font-bold text-sm`} style={{ color: gold }}>
                  STATION {pickerStation} — PICK EXERCISE
                </p>
                <p className="text-xs opacity-40 mt-0.5">
                  {libraryLoading ? "Loading library…" : `${filteredExercises.length} of ${allExercises.length} exercises`}
                </p>
              </div>
              <button onClick={() => { setPickerOpen(false); setPreviewExercise(null); }} className="text-xl opacity-40 hover:opacity-100">✕</button>
            </div>

            {/* Search */}
            <div className="px-5 pt-3 pb-2 border-b" style={{ borderColor: hexToRgba(gold, 0.1) }}>
              <input
                type="search"
                placeholder="Search exercises…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: hexToRgba(gold, 0.08), color: accent, border: `1px solid ${hexToRgba(gold, 0.2)}` }}
              />
            </div>

            {/* Filters */}
            <div className="px-5 py-3 space-y-2 border-b" style={{ borderColor: hexToRgba(gold, 0.1) }}>
              {/* Exercise Type */}
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(EXERCISE_TYPES).map(([t, label]) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: filterType === t ? gold : hexToRgba(gold, 0.08),
                      color: filterType === t ? "#0f0f0f" : hexToRgba(accent, 0.7),
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Body Part */}
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(BODY_PART_LABELS) as (BodyPart | "all")[]).map((bp) => (
                  <button
                    key={bp}
                    onClick={() => setFilterBodyPart(bp)}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: filterBodyPart === bp ? gold : hexToRgba(gold, 0.08),
                      color: filterBodyPart === bp ? "#0f0f0f" : hexToRgba(accent, 0.7),
                    }}
                  >
                    {BODY_PART_LABELS[bp]}
                  </button>
                ))}
              </div>
              {/* Movement */}
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(MOVEMENT_LABELS) as (MovementType | "all")[]).map((mt) => (
                  <button
                    key={mt}
                    onClick={() => setFilterMovement(mt)}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: filterMovement === mt ? gold : hexToRgba(gold, 0.08),
                      color: filterMovement === mt ? "#0f0f0f" : hexToRgba(accent, 0.7),
                    }}
                  >
                    {MOVEMENT_LABELS[mt]}
                  </button>
                ))}
              </div>
              {/* Equipment — built dynamically from database */}
              {availableEquipment.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterEquipment("all")}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: filterEquipment === "all" ? gold : hexToRgba(gold, 0.08),
                      color: filterEquipment === "all" ? "#0f0f0f" : hexToRgba(accent, 0.7),
                    }}
                  >
                    All Equipment
                  </button>
                  {availableEquipment.map((eq) => (
                    <button
                      key={eq}
                      onClick={() => setFilterEquipment(eq)}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all capitalize"
                      style={{
                        background: filterEquipment === eq ? gold : hexToRgba(gold, 0.08),
                        color: filterEquipment === eq ? "#0f0f0f" : hexToRgba(accent, 0.7),
                      }}
                    >
                      {eq}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Exercise list */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                {libraryLoading ? (
                  <div className="px-4 py-10 text-center text-sm opacity-40">Loading exercises…</div>
                ) : filteredExercises.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm opacity-40">
                    {allExercises.length === 0
                      ? "No exercises found in database"
                      : "No exercises match these filters"}
                  </div>
                ) : (
                  filteredExercises.map((ex) => {
                    const isPreviewing = previewExercise?.id === ex.id;
                    return (
                      <div
                        key={ex.id}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
                        style={{ background: isPreviewing ? hexToRgba(gold, 0.08) : "transparent" }}
                        onClick={() => setPreviewExercise(isPreviewing ? null : ex)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: accent }}>
                            {ex.name}
                          </p>
                          <div className="flex gap-1.5 mt-0.5 flex-wrap items-center">
                            {ex.equipment && <span className="text-xs opacity-50">{ex.equipment}</span>}
                            {ex.body_part && (
                              <span className="text-xs opacity-50">· {BODY_PART_LABELS[ex.body_part]}</span>
                            )}
                            {ex.movement_type && (
                              <span className="text-xs opacity-50">· {MOVEMENT_LABELS[ex.movement_type]}</span>
                            )}
                            <span
                              className="text-xs px-1.5 py-0.5 rounded capitalize opacity-60"
                              style={{ background: hexToRgba(gold, 0.1) }}
                            >
                              {ex.type}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); addExerciseToStation(ex, pickerStation); }}
                          className="px-3 py-1 rounded-lg text-xs font-bold flex-shrink-0 transition-all"
                          style={{ background: gold, color: "#0f0f0f" }}
                        >
                          Add
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Preview panel */}
              {previewExercise && (
                <div
                  className="w-56 flex-shrink-0 border-l flex flex-col"
                  style={{ borderColor: hexToRgba(gold, 0.12), background: "#111" }}
                >
                  <div className="aspect-video bg-black">
                    {previewExercise.demo_url && (
                      <CloudflarePlayer
                        videoId={previewExercise.demo_url}
                        muted
                        loop
                        autoPlay
                        controls={false}
                      />
                    )}
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto">
                    <p className="font-bold text-sm" style={{ color: gold }}>
                      {previewExercise.name}
                    </p>
                    {previewExercise.tags && previewExercise.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {previewExercise.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 rounded opacity-60"
                            style={{ background: hexToRgba(gold, 0.1) }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {previewExercise.cues && (
                      <p className="mt-2 text-xs opacity-60 leading-relaxed">{previewExercise.cues}</p>
                    )}
                  </div>
                  <div className="p-3 border-t" style={{ borderColor: hexToRgba(gold, 0.1) }}>
                    <button
                      onClick={() => addExerciseToStation(previewExercise, pickerStation)}
                      className="w-full py-2 rounded-lg text-sm font-bold"
                      style={{ background: gold, color: "#0f0f0f" }}
                    >
                      Add to Station {pickerStation}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
