"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Orbitron, Outfit } from "next/font/google";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  storage,
  STORAGE_KEYS,
  type StationExercise,
  type WorkoutPlan,
  type WorkoutSetup,
} from "@/lib/workout-engine/storage";
import { type ExerciseMedia } from "@/lib/lib/exercise-library";
import { useExerciseMediaLibrary } from "@/lib/workout-engine/library-hooks";
import { useVenueContext } from "@/lib/venue-context";
import CloudflarePlayer from "@/components/CloudflarePlayer";
import { generateWorkoutPlan } from "@/lib/workout-engine/generator";

const GOALS = ["Fat Loss", "Strength", "Endurance"] as const;
type GoalOption = (typeof GOALS)[number];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "700", "900"] });
const outfit = Outfit({ subsets: ["latin"], weight: ["400", "600", "800"] });

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) return `rgba(255,255,255,${alpha})`;
  const numeric = parseInt(sanitized, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function BuilderPage() {
  const router = useRouter();
  const [setup, setSetup] = useState<WorkoutSetup | null>(null);
  const [storedPlan, setStoredPlan] = useState<WorkoutPlan | null>(null);
  const { activeVenue } = useVenueContext();

  // Get brand colors using default values since branding might not exist in setup
  const brandColors = useMemo(() => {
    if (activeVenue?.colors) return activeVenue.colors;
    if (setup?.colors) return setup.colors;
    return { primary: "#00BFFF", secondary: "#14B8A6", accent: "#F59E0B" };
  }, [activeVenue, setup]);

  const { primary: primaryBrand, secondary: secondaryBrand, accent: accentBrand } = brandColors;

  const [goal, setGoal] = useState<GoalOption>("Fat Loss");
  const [libraryEquipment, setLibraryEquipment] = useState<string | null>(null);
  const [libraryExercise, setLibraryExercise] = useState<string | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [isUpdatingLibrary, setIsUpdatingLibrary] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [workoutName, setWorkoutName] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  
  const {
    library: exerciseLibrary,
    isLoading: isLibraryLoading,
    error: libraryLoadError,
  } = useExerciseMediaLibrary();
  const libraryError = libraryLoadError;

  // Initial load
  useEffect(() => {
    const initialSetup = storage.getSetup();
    const initialPlan = storage.getPlan();
    
    if (initialSetup) {
      setSetup(initialSetup);
    } else {
      router.replace("/setup");
    }

    if (initialPlan) {
      setStoredPlan(initialPlan);
      setGoal((initialPlan.goal as GoalOption) ?? "Fat Loss");
      setWorkoutName(initialPlan.name || "");
      setSelectedExercises(
        initialPlan.exercises.reduce((acc: Record<string, string>, entry: any) => {
          const key = initialSetup?.exercisesPerStation && initialSetup.exercisesPerStation > 1 ? `${entry.stationId}_${entry.part || 0}` : `${entry.stationId}`;
          acc[key] = entry.name;
          return acc;
        }, {} as Record<string, string>)
      );
    }
  }, [router]);

  // Subscriptions
  useEffect(() => {
    const unsubPlan = storage.subscribe(STORAGE_KEYS.plan, (nextPlan) => {
      if (!nextPlan) return;
      setStoredPlan(nextPlan);
      setSavedAt(new Date().toLocaleString());
      setGoal((nextPlan.goal as GoalOption) ?? "Fat Loss");
      setWorkoutName(nextPlan.name || "");
      setSelectedExercises(
        nextPlan.exercises.reduce((acc: Record<string, string>, entry: any) => {
          const key = setup?.exercisesPerStation && setup.exercisesPerStation > 1 ? `${entry.stationId}_${entry.part || 0}` : `${entry.stationId}`;
          acc[key] = entry.name;
          return acc;
        }, {} as Record<string, string>)
      );
    });

    const unsubSetup = storage.subscribe(STORAGE_KEYS.setup, (nextSetup) => {
      if (nextSetup) {
        setSetup(nextSetup);
        // Resync selected exercises when setup changes
        const currentPlan = storage.getPlan();
        if (currentPlan) {
          setSelectedExercises(
            currentPlan.exercises.reduce((acc: Record<string, string>, entry: any) => {
              const key = nextSetup.exercisesPerStation && nextSetup.exercisesPerStation > 1 ? `${entry.stationId}_${entry.part || 0}` : `${entry.stationId}`;
              acc[key] = entry.name;
              return acc;
            }, {} as Record<string, string>)
          );
        }
      }
    });

    return () => {
      unsubPlan?.();
      unsubSetup?.();
    };
  }, [setup?.mode, setup?.exercisesPerStation]);

  useEffect(() => {
    if (setup?.facilityName?.toLowerCase().includes("hotel fit")) {
      const nextSetup = { ...setup, facilityName: "AVLR" };
      storage.saveSetup(nextSetup);
      setSetup(nextSetup);
    }
  }, [setup]);

  const libraryEquipmentOptions = useMemo(() => {
    return Array.from(
      new Set(exerciseLibrary.map((exercise) => exercise.equipment.toLowerCase()))
    ).sort();
  }, [exerciseLibrary]);

  const libraryExercisesForEquipment = useMemo(() => {
    if (!libraryEquipment) return [];
    let filtered = exerciseLibrary.filter(
      (exercise) => exercise.equipment.toLowerCase() === libraryEquipment.toLowerCase()
    );
    if (librarySearch) {
      const s = librarySearch.toLowerCase();
      filtered = filtered.filter(ex => ex.name.toLowerCase().includes(s));
    }
    return filtered;
  }, [exerciseLibrary, libraryEquipment, librarySearch]);

  const selectedLibraryExerciseData = useMemo(() => {
    if (!libraryExercise) return null;
    return exerciseLibrary.find(
      (exercise) =>
        exercise.name === libraryExercise &&
        (!libraryEquipment || exercise.equipment.toLowerCase() === libraryEquipment.toLowerCase())
    );
  }, [exerciseLibrary, libraryExercise, libraryEquipment]);

  useEffect(() => {
    if (!libraryEquipment && exerciseLibrary.length) {
      setLibraryEquipment(exerciseLibrary[0].equipment);
      setLibraryExercise(exerciseLibrary[0].name);
    }
  }, [exerciseLibrary, libraryEquipment]);

  if (!setup) {
    return null;
  }

  const getOptionsForEquipment = (equipment: string): ExerciseMedia[] => {
    return exerciseLibrary.filter(
      (exercise) =>
        exercise.equipment.toLowerCase() === equipment.toLowerCase()
    ).sort((a, b) => {
      if (a.video && !b.video) return -1;
      if (!a.video && b.video) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  const ensureSelections = (): StationExercise[] | null => {
    const assignments: StationExercise[] = [];
    const sanitizedSelections: Record<string, string> = { ...selectedExercises };

    for (const station of setup.stations) {
      const options = getOptionsForEquipment(station.equipment);
      if (!options.length) {
        setError(
          `No exercises with video available for Station ${station.id} (${station.equipment}). Adjust equipment or update your library.`
        );
        return null;
      }

      const exerciseCount = setup.exercisesPerStation ?? (setup.mode === 'studio-b' ? 2 : 1);
      
      for (let i = 0; i < exerciseCount; i++) {
        const key = exerciseCount > 1 ? `${station.id}_${i}` : `${station.id}`;
        const chosenName = sanitizedSelections[key];
        const selectedMeta =
          options.find((option) => option.name === chosenName) ?? (i === 1 && options.length > 1 ? options[1] : options[0]);

        sanitizedSelections[key] = selectedMeta.name;
        assignments.push({
          stationId: station.id,
          name: selectedMeta.name,
          video: selectedMeta.video ?? null,
          equipment: selectedMeta.equipment ?? station.equipment,
          muscles: selectedMeta.muscles,
          cues: selectedMeta.cues,
          part: i,
        });
      }
    }

    setSelectedExercises(sanitizedSelections);
    return assignments;
  };

  const handleSave = async (asTemplate: boolean = false) => {
    if (isSaving) return;
    setError(null);
    const assignments = ensureSelections();
    if (!assignments) return;

    setIsSaving(true);
    const now = new Date();
    const payload: WorkoutPlan = {
      name: workoutName || goal || "Active Workout",
      goal,
      exercises: assignments,
      studioMode: setup?.mode || 'studio-a',
      scheduledDate: scheduledDate || undefined,
    };

    if (!asTemplate) {
      storage.savePlan(payload);
      storage.clearSession();
    }
    
    setSavedAt(now.toLocaleString());

    if (supabaseClient) {
      try {
        const id = asTemplate ? `template_${Date.now()}` : (scheduledDate || "active");
        const { error: syncError } = await supabaseClient
          .from("workouts")
          .upsert(
            [
              {
                id: id,
                name: workoutName || goal || (asTemplate ? "New Template" : "Active Workout"),
                data: payload,
                updated_at: now.toISOString(),
                is_template: asTemplate,
                scheduled_date: scheduledDate || null
              },
            ],
            { onConflict: "id" }
          );

        if (syncError) {
          console.error("Supabase sync error:", syncError);
          setError(`Cloud sync failed: ${syncError.message}. Plan saved locally.`);
        } else if (asTemplate) {
          setSavedAt("Template Saved!");
        }
      } catch (err) {
        console.error("Failed to sync workout plan", err);
        setError("Plan saved locally but failed to sync due to a connection error.");
      }
    }

    setIsSaving(false);
  };

  const fetchTemplates = async () => {
    if (!supabaseClient) return;
    setIsLoadingTemplates(true);
    try {
      const { data, error } = await supabaseClient
        .from("workouts")
        .select("*")
        .eq("is_template", true)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error("Failed to fetch templates", err);
      setError("Failed to load templates.");
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const loadTemplate = (template: any) => {
    const plan = template.data as WorkoutPlan;
    setStoredPlan(plan);
    setGoal((plan.goal as GoalOption) ?? "Fat Loss");
    setWorkoutName(plan.name || "");
    
    const newSelections: Record<string, string> = {};
    plan.exercises.forEach((ex) => {
      const key = setup.exercisesPerStation && setup.exercisesPerStation > 1 
        ? `${ex.stationId}_${ex.part || 0}` 
        : `${ex.stationId}`;
      newSelections[key] = ex.name;
    });
    setSelectedExercises(newSelections);
    setShowLibrary(false);
    setSavedAt("Template Loaded");
  };

  const handleAiGenerate = async () => {
    if (!setup || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const newPlan = generateWorkoutPlan(setup, exerciseLibrary);
      setStoredPlan(newPlan);
      setGoal((newPlan.goal as GoalOption) ?? "Fat Loss");
      setWorkoutName(newPlan.name || "");
      
      const newSelections: Record<string, string> = {};
      newPlan.exercises.forEach((ex) => {
        const key = setup.exercisesPerStation && setup.exercisesPerStation > 1 
          ? `${ex.stationId}_${ex.part || 0}` 
          : `${ex.stationId}`;
        newSelections[key] = ex.name;
      });
      setSelectedExercises(newSelections);
      setSavedAt("Unsaved AI Draft");
    } catch (err) {
      console.error("AI Generation failed", err);
      setError("AI Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleUpdateVideoUrl = async (exercise: ExerciseMedia) => {
    if (!supabaseClient || isUpdatingLibrary) return;
    setIsUpdatingLibrary(true);
    setError(null);

    try {
      const { error: updateError } = await supabaseClient
        .from("exercise_library")
        .update({ video_url: newVideoUrl })
        .eq("exercise_name", exercise.name);

      if (updateError) throw updateError;

      setSavedAt(new Date().toLocaleString());
      setEditingVideoId(null);
      exercise.video = newVideoUrl;
    } catch (err) {
      console.error("Failed to update video URL", err);
      setError("Failed to update video URL in Supabase.");
    } finally {
      setIsUpdatingLibrary(false);
    }
  };

  const handleStationEquipmentChange = (stationId: number, equipment: string) => {
    if (!setup) return;
    const nextSetup = { ...setup };
    const station = nextSetup.stations.find(s => s.id === stationId);
    if (station) {
      station.equipment = equipment;
      setSetup(nextSetup);
      storage.saveSetup(nextSetup);
    }
  };

  const handleExerciseChange = (stationId: number, name: string, part: number = 0) => {
    const exerciseCount = setup.exercisesPerStation ?? (setup.mode === 'studio-b' ? 2 : 1);
    const key = exerciseCount > 1 ? `${stationId}_${part}` : `${stationId}`;
    setSelectedExercises((prev) => ({ ...prev, [key]: name }));
  };

  const handleLibraryEquipmentChange = (value: string) => {
    setLibraryEquipment(value);
    const firstExercise = exerciseLibrary.find(
      (exercise) => exercise.equipment.toLowerCase() === value.toLowerCase()
    );
    setLibraryExercise(firstExercise?.name ?? null);
  };

  const handleLibraryExerciseChange = (value: string) => {
    setLibraryExercise(value);
  };

  return (
    <main
      className={`${outfit.className} relative flex min-h-screen w-screen items-center justify-center bg-black text-white`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#202020,transparent_55%)]" />

      {!showDebug && (
        <button
          className="fixed top-4 left-4 z-50 bg-blue-900 text-white border-2 border-blue-400 rounded-full shadow-lg px-3 py-2 text-xs"
          style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowDebug(true)}
        >
          🐞
        </button>
      )}
      {showDebug && (
        <div className="fixed top-4 left-4 z-50 bg-black text-white border-2 border-blue-400 rounded-lg shadow-lg p-3 text-xs max-w-xs flex flex-col items-start">
          <div className="flex w-full justify-between items-center mb-2">
            <strong>Debug Panel</strong>
            <button
              className="ml-2 px-2 py-1 bg-blue-900 text-white rounded-full border border-blue-400 text-xs"
              onClick={() => setShowDebug(false)}
            >
              ✕
            </button>
          </div>
          <div className="mt-2">Last Saved: {savedAt ?? "Never"}</div>
          <div className="mt-1">Error: {error ?? "None"}</div>
          <div className="mt-1">Plan: {JSON.stringify(storage.getPlan())}</div>
          <div className="mt-1">Setup: {JSON.stringify(setup)}</div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-10 lg:px-12 lg:py-12">
        {libraryError && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {libraryError} Using the local exercise list as a fallback.
          </div>
        )}
        <div className="mb-6 rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-slate-300 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Active Venue</p>
            <p className="text-base text-white">
              {activeVenue?.name ?? setup?.facilityName ?? "Default Builder Context"}
            </p>
          </div>
          <div className="flex gap-3">
            {(["primary", "secondary", "accent"] as const).map((token) => (
              <div key={token} className="flex flex-col items-center text-[10px] uppercase tracking-[0.4em] text-slate-500">
                <span>{token}</span>
                <span
                  className="mt-1 h-8 w-8 rounded-full border border-white/10"
                  style={{ backgroundColor: (brandColors as any)[token] }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mb-8">
          <div className="rounded-2xl border border-white/10 bg-black/50 p-6 shadow-lg backdrop-blur">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Exercise Library</p>
                <h3 className="text-2xl font-semibold text-white">Equipment & Videos</h3>
                <p className="text-sm text-slate-300">
                  Explore every exercise. Use the 🎥 icon to find exercises with videos.
                </p>
                {isLibraryLoading ? (
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500 mt-2">
                    Loading venue library...
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-3 md:flex-row items-end">
                <div className="w-full md:w-48">
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Search
                  </label>
                  <input
                    type="text"
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    placeholder="Search name..."
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Equipment
                  </label>
                  <select
                    value={libraryEquipment ?? ""}
                    onChange={(event) => handleLibraryEquipmentChange(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                  >
                    {libraryEquipmentOptions.map((equipment) => (
                      <option key={equipment} value={equipment}>
                        {equipment}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Exercise ({libraryExercisesForEquipment.length})
                  </label>
                  <select
                    value={libraryExercise ?? ""}
                    onChange={(event) => handleLibraryExerciseChange(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                  >
                    {libraryExercisesForEquipment.map((exercise) => (
                      <option key={exercise.name} value={exercise.name}>
                        {exercise.video ? "🎥 " : "⚠️ "}{exercise.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAiGenerate}
                  disabled={isGenerating || isLibraryLoading}
                  className="mt-1 rounded-lg border-2 border-purple-500/50 bg-purple-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-purple-300 hover:bg-purple-500/20 disabled:opacity-50"
                >
                  {isGenerating ? "Magic..." : "✨ AI Generate"}
                </button>
              </div>
            </div>
            {selectedLibraryExerciseData && (
              <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-slate-200">
                  <div className="mb-4">
                    {selectedLibraryExerciseData.video && (
                      <div 
                        className="relative w-full rounded-xl border border-white/10 overflow-hidden bg-black max-h-[500px] flex items-center justify-center"
                        style={{ boxShadow: `0 0 30px ${hexToRgba(accentBrand, 0.15)}` }}
                      >
                        <CloudflarePlayer
                          videoId={selectedLibraryExerciseData.video}
                          autoPlay={true}
                          controls={true}
                          className="w-full h-full"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mb-3 flex items-center gap-3">
                    <span 
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        selectedLibraryExerciseData.video 
                          ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {selectedLibraryExerciseData.video ? "🎥 Video Ready" : "⚠️ Missing Video"}
                    </span>
                    <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                      {selectedLibraryExerciseData.equipment}
                    </span>
                  </div>
                  <p className="flex items-center gap-2">
                    <span className="text-slate-400">Video ID:</span>{" "}
                    {editingVideoId === selectedLibraryExerciseData.name ? (
                      <div className="flex items-center gap-2 flex-grow">
                        <input
                          type="text"
                          value={newVideoUrl}
                          onChange={(e) => setNewVideoUrl(e.target.value)}
                          className="flex-grow rounded border border-white/20 bg-black/40 px-2 py-1 text-xs text-white"
                          placeholder="Cloudflare Video ID"
                        />
                        <button
                          onClick={() => handleUpdateVideoUrl(selectedLibraryExerciseData)}
                          disabled={isUpdatingLibrary}
                          className="rounded bg-sky-600 px-2 py-1 text-[10px] uppercase font-bold text-white hover:bg-sky-500"
                        >
                          {isUpdatingLibrary ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingVideoId(null)}
                          className="text-[10px] uppercase font-bold text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sky-300 font-mono text-xs">
                          {selectedLibraryExerciseData.video || "No Video Assigned"}
                        </span>
                        <button
                          onClick={() => {
                            setEditingVideoId(selectedLibraryExerciseData.name);
                            setNewVideoUrl(selectedLibraryExerciseData.video || "");
                          }}
                          className="ml-2 text-[10px] uppercase font-bold text-sky-400 hover:text-sky-300 transition-colors"
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </p>
                  {selectedLibraryExerciseData.muscles && (
                    <p className="mt-2">
                      <span className="text-slate-400">Muscles:</span>{" "}
                      {selectedLibraryExerciseData.muscles.join(", ")}
                    </p>
                  )}
                  {selectedLibraryExerciseData.cues && (
                    <p className="mt-2">
                      <span className="text-slate-400">Cues:</span>{" "}
                      {selectedLibraryExerciseData.cues.join(" • ")}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-white/10 bg-black/60 p-4 text-sm text-slate-200">
                  <p className="text-slate-400">Next Steps</p>
                  <ul className="mt-2 space-y-1 text-slate-200">
                    <li>• Upload new exercise videos to Supabase storage.</li>
                    <li>• Insert metadata into the `exercise_media` table.</li>
                    <li>• Refresh this page to see the updates instantly.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="rounded-[24px] border border-white/10 bg-black/60 p-10 shadow-[0_0_45px_rgba(0,0,0,0.4)] backdrop-blur-md"
        >
          <div className="flex justify-end items-center mb-6 gap-4">
            <button
              onClick={() => {
                setShowLibrary(!showLibrary);
                if (!showLibrary) fetchTemplates();
              }}
              className="text-xs uppercase tracking-[0.2em] rounded-full px-4 py-2 border border-sky-400/30 bg-sky-400/10 text-sky-300 hover:bg-sky-400/20"
            >
              📂 Workout Library
            </button>
            <span
              className="text-xs uppercase tracking-[0.3em] rounded-full px-4 py-2 border-2"
              style={{
                color: accentBrand,
                borderColor: hexToRgba(accentBrand, 0.5),
                backgroundColor: hexToRgba(accentBrand, 0.1)
              }}
            >
              Status: {savedAt ?? "Ready"}
            </span>
          </div>

          {showLibrary && (
            <div className="mb-8 rounded-2xl border border-sky-500/30 bg-sky-950/20 p-6 backdrop-blur-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold uppercase tracking-widest text-sky-400">Template Library</h3>
                <button onClick={() => setShowLibrary(false)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              {isLoadingTemplates ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-xs text-sky-400/60 font-medium">Scanning Vault...</p>
                </div>
              ) : templates.length === 0 ? (
                <p className="text-center py-8 text-sm text-slate-500">No saved templates found.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => loadTemplate(tpl)}
                      className="flex flex-col gap-1 p-3 rounded-xl border border-white/5 bg-white/5 text-left hover:bg-white/10 transition-all border-l-4 border-l-sky-500"
                    >
                      <span className="text-sm font-bold truncate">{tpl.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-tighter">
                        {tpl.data?.exercises?.length || 0} Exercises • {new Date(tpl.updated_at).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <header className="flex flex-col gap-6 text-center mb-10">
            {setup.logo && (
              <div className="flex justify-center">
                <Image
                  src={setup.logo}
                  alt="Gym logo"
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full border-3 shadow-lg"
                  style={{
                    borderColor: primaryBrand,
                    filter: `drop-shadow(0 0 20px ${hexToRgba(primaryBrand, 0.4)})`
                  }}
                />
              </div>
            )}
            <div>
              <p
                className="text-sm uppercase tracking-[0.55em] mb-1"
                style={{ color: hexToRgba(secondaryBrand, 0.9) }}
              >
                {setup?.facilityName || "BUILDER CONSOLE"}
              </p>
              <h1
                className={`text-4xl font-extrabold uppercase mb-2 ${orbitron.className}`}
                style={{
                  color: primaryBrand,
                  textShadow: `0 0 25px ${hexToRgba(primaryBrand, 0.5)}`
                }}
              >
                Exercise Builder
              </h1>
              <div className="flex justify-center mt-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] px-3 py-1 rounded-full border border-white/10 bg-white/5 text-slate-400">
                  Mode: <span className="text-sky-400">{setup.mode === 'studio-b' ? 'Studio B (Dual)' : 'Studio A (Standard)'}</span>
                </span>
              </div>
            </div>
          </header>

          <section className="mb-8 grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Workout Name</label>
              <input
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="e.g., Morning HIIT Blast"
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Scheduled Date (Optional)</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
              />
            </div>
          </section>

          <section
            className="flex flex-col gap-6 rounded-[20px] border-2 p-6 mb-8 shadow-lg"
            style={{
              borderColor: hexToRgba(accentBrand, 0.4),
              backgroundColor: hexToRgba(accentBrand, 0.05),
              boxShadow: `0 0 30px ${hexToRgba(accentBrand, 0.15)}`
            }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center">
                <span
                  className="font-bold uppercase tracking-[0.25em]"
                  style={{ color: accentBrand }}
                >
                  Goal Focus
                </span>
                <select
                  className="rounded-[12px] border-2 px-4 py-3 font-medium bg-black/80"
                  style={{
                    borderColor: hexToRgba(primaryBrand, 0.3),
                    color: "white"
                  }}
                  value={goal}
                  onChange={(event) => setGoal(event.target.value as GoalOption)}
                >
                  {GOALS.map((value) => (
                    <option key={value} value={value} className="bg-black">
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <Link
                href="/setup"
                className="text-sm uppercase tracking-[0.25em] hover:opacity-80 transition-opacity"
                style={{ color: secondaryBrand }}
              >
                Edit Station Setup
              </Link>
              <Link
                href="/program-builder"
                className="text-sm uppercase tracking-[0.25em] hover:opacity-80 transition-opacity"
                style={{ color: secondaryBrand }}
              >
                10-Day Program →
              </Link>
            </div>
          </section>

          <section className="space-y-6">
            {setup.stations.map((station) => {
              const options = getOptionsForEquipment(station.equipment);
              const exerciseCount = setup.exercisesPerStation ?? (setup.mode === 'studio-b' ? 2 : 1);

              return (
                <div
                  key={station.id}
                  className="flex flex-col gap-6 rounded-[20px] border-2 p-6 shadow-lg"
                  style={{
                    borderColor: hexToRgba(primaryBrand, 0.3),
                    backgroundColor: "rgba(0,0,0,0.6)",
                    boxShadow: `0 0 25px ${hexToRgba(primaryBrand, 0.1)}`
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <p
                      className="text-sm uppercase tracking-[0.3em] font-bold mb-1"
                      style={{ color: primaryBrand }}
                    >
                      STATION {station.id}
                    </p>
                    <div className="flex items-center gap-3">
                      <p
                        className="text-sm"
                        style={{ color: hexToRgba(secondaryBrand, 0.8) }}
                      >
                        Equipment:
                      </p>
                      <select
                        value={station.equipment}
                        onChange={(e) => handleStationEquipmentChange(station.id, e.target.value)}
                        className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white focus:border-sky-400 focus:outline-none"
                      >
                        {libraryEquipmentOptions.map((eq) => (
                          <option key={eq} value={eq}>
                            {eq}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="mt-2 flex items-center gap-2 cursor-pointer group">
                      <div 
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${station.locked ? 'bg-sky-500 border-sky-400' : 'border-white/20'}`}
                        onClick={() => {
                          const nextSetup = { ...setup };
                          const s = nextSetup.stations.find(st => st.id === station.id);
                          if (s) s.locked = !s.locked;
                          setSetup(nextSetup);
                          storage.saveSetup(nextSetup);
                        }}
                      >
                        {station.locked && <span className="text-[10px]">L</span>}
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 group-hover:text-slate-300">Lock Machine / Fixed Exercise</span>
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: exerciseCount }).map((_, i) => {
                      const key = setup.mode === 'studio-b' ? `${station.id}_${i}` : `${station.id}`;
                      const currentSelection = selectedExercises[key];
                      const selection = options.find((exercise) => exercise.name === currentSelection)?.name ?? options[i % options.length]?.name ?? "";

                      return (
                        <div key={i} className="flex flex-col gap-2">
                          <p className={`text-[10px] uppercase font-bold tracking-widest ${exerciseCount > 1 ? 'text-sky-400' : 'text-slate-500'}`}>
                            {exerciseCount > 1 ? `Exercise ${i + 1}` : 'Selected Exercise'}
                          </p>
                          <select
                            className="rounded-[12px] border-2 px-4 py-3 font-medium bg-black/80 w-full"
                            style={{
                              borderColor: hexToRgba(accentBrand, 0.4),
                              color: "white"
                            }}
                            value={selection}
                            onChange={(event) => handleExerciseChange(station.id, event.target.value, i)}
                          >
                            {options.map((exercise) => (
                              <option key={exercise.name} value={exercise.name} className="bg-black">
                                {exercise.video ? "🎥 " : ""}{exercise.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                  
                  {!options.length && (
                    <p className="text-xs text-red-400 font-medium">
                      No exercises available for {station.equipment}. Update your library to continue.
                    </p>
                  )}
                </div>
              );
            })}
          </section>

          <div className="flex justify-end items-center gap-6 mt-8">
            {error && (
              <span
                className="text-sm font-medium"
                style={{ color: "#FF4D4D" }}
              >
                {error}
              </span>
            )}
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="rounded-[12px] px-6 py-4 font-bold uppercase tracking-[0.2em] border-2 border-white/10 hover:bg-white/5 transition-all"
            >
              {isSaving ? "Wait..." : "💾 Save Template"}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="rounded-[12px] px-8 py-4 font-bold uppercase tracking-[0.2em] shadow-lg border-2 disabled:opacity-60 transition-all hover:scale-105"
              style={{
                backgroundColor: primaryBrand,
                borderColor: hexToRgba(primaryBrand, 0.8),
                color: "black",
                boxShadow: `0 0 30px ${hexToRgba(primaryBrand, 0.4)}`
              }}
            >
              {isSaving ? "Saving..." : scheduledDate ? "📅 Schedule" : "🚀 Go Live"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
