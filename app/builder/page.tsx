"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

const GOALS = ["Fat Loss", "Strength", "Endurance"] as const;
type GoalOption = (typeof GOALS)[number];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

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
  const setup = useMemo<WorkoutSetup | null>(() => storage.getSetup(), []);
  const storedPlan = useMemo<WorkoutPlan | null>(() => storage.getPlan(), []);
  const { activeVenue } = useVenueContext();

  // Get brand colors using default values since branding might not exist in setup
  const brandColors = useMemo(() => {
    if (activeVenue?.colors) return activeVenue.colors;
    if (setup?.colors) return setup.colors;
    return { primary: "#00BFFF", secondary: "#14B8A6", accent: "#F59E0B" };
  }, [activeVenue, setup]);

  const { primary: primaryBrand, secondary: secondaryBrand, accent: accentBrand } = brandColors;

  const [goal, setGoal] = useState<GoalOption>(
    (storedPlan?.goal as GoalOption | undefined) ?? "Fat Loss"
  );
  const [libraryEquipment, setLibraryEquipment] = useState<string | null>(
    null
  );
  const [libraryExercise, setLibraryExercise] = useState<string | null>(
    null
  );
  const [selectedExercises, setSelectedExercises] = useState<Record<number, string>>(() => {
    if (!setup || !storedPlan?.exercises?.length) return {};
    return storedPlan.exercises.reduce<Record<number, string>>((acc, entry) => {
      acc[entry.stationId] = entry.name;
      return acc;
    }, {});
  });
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [isUpdatingLibrary, setIsUpdatingLibrary] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const {
    library: exerciseLibrary,
    isLoading: isLibraryLoading,
    error: libraryLoadError,
  } = useExerciseMediaLibrary();
  const libraryError = libraryLoadError;

  useEffect(() => {
    if (!setup) router.replace("/setup");
  }, [router, setup]);

  useEffect(() => {
    const unsubscribe = storage.subscribe(STORAGE_KEYS.plan, (nextPlan) => {
      if (!nextPlan) return;
      setSavedAt(new Date().toLocaleString());
      setGoal((nextPlan.goal as GoalOption) ?? "Fat Loss");
      setSelectedExercises(
        nextPlan.exercises.reduce((acc: Record<number, string>, entry: any) => {
          acc[entry.stationId] = entry.name;
          return acc;
        }, {} as Record<number, string>)
      );
    });
    return () => unsubscribe?.();
  }, []);

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
      // Prioritize exercises with videos
      if (a.video && !b.video) return -1;
      if (!a.video && b.video) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  const ensureSelections = (): StationExercise[] | null => {
    const assignments: StationExercise[] = [];
    const sanitizedSelections: Record<number, string> = { ...selectedExercises };

    for (const station of setup.stations) {
      const options = getOptionsForEquipment(station.equipment);
      if (!options.length) {
        setError(
          `No exercises with video available for Station ${station.id} (${station.equipment}). Adjust equipment or update your library.`
        );
        return null;
      }

      const chosenName = sanitizedSelections[station.id];
      const selectedMeta =
        options.find((option) => option.name === chosenName) ?? options[0];

      sanitizedSelections[station.id] = selectedMeta.name;
      assignments.push({
        stationId: station.id,
        name: selectedMeta.name,
        video: selectedMeta.video ?? null,
        equipment: selectedMeta.equipment ?? station.equipment,
        muscles: selectedMeta.muscles,
        cues: selectedMeta.cues,
      });
    }

    setSelectedExercises(sanitizedSelections);
    return assignments;
  };

  const handleSave = async () => {
    if (isSaving) return;
    setError(null);
    const assignments = ensureSelections();
    if (!assignments) return;

    setIsSaving(true);
    const now = new Date();
    const payload: WorkoutPlan = {
      goal,
      exercises: assignments,
    };

    storage.savePlan(payload);
    storage.clearSession();
    setSavedAt(now.toLocaleString());

    if (supabaseClient) {
      try {
        const { error: syncError } = await supabaseClient
          .from("workouts")
          .upsert(
            [
              {
                id: "active",
                name: goal || "Active Workout",
                data: payload,
                updated_at: now.toISOString(),
              },
            ],
            { onConflict: "id" }
          );

        if (syncError) {
          console.error("Supabase sync error:", syncError);
          setError(`Cloud sync failed: ${syncError.message}. Plan saved locally.`);
        }
      } catch (err) {
        console.error("Failed to sync workout plan", err);
        setError("Plan saved locally but failed to sync due to a connection error.");
      }
    }

    setIsSaving(false);
  };
  
  const handleUpdateVideoUrl = async (exercise: ExerciseMedia) => {
    if (!supabaseClient || isUpdatingLibrary) return;
    setIsUpdatingLibrary(true);
    setError(null);

    try {
      // Find the Supabase record ID if we have it
      const { error: updateError } = await supabaseClient
        .from("exercise_library")
        .update({ video_url: newVideoUrl })
        .eq("exercise_name", exercise.name);

      if (updateError) throw updateError;

      // Refresh the library by triggering a reload or local update
      // For now, we'll inform the user and suggest a refresh
      setSavedAt(new Date().toLocaleString());
      setEditingVideoId(null);
      
      // Proactively update local state to avoid refresh
      exercise.video = newVideoUrl;
    } catch (err) {
      console.error("Failed to update video URL", err);
      setError("Failed to update video URL in Supabase.");
    } finally {
      setIsUpdatingLibrary(false);
    }
  };

  const handleExerciseChange = (stationId: number, name: string) => {
    setSelectedExercises((prev) => ({ ...prev, [stationId]: name }));
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
      className="font-orbitron relative flex min-h-screen w-screen items-center justify-center bg-black text-white"
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
                  style={{ backgroundColor: brandColors[token] }}
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
              </div>
            </div>
            {selectedLibraryExerciseData && (
              <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-slate-200">
                  <div className="mb-4">
                    {selectedLibraryExerciseData.video && (
                      <div 
                        className="relative w-full rounded-xl border border-white/10 overflow-hidden bg-black aspect-video"
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
          <div className="flex justify-end mb-6">
            <span
              className="text-xs uppercase tracking-[0.3em] rounded-full px-4 py-2 border-2"
              style={{
                color: accentBrand,
                borderColor: hexToRgba(accentBrand, 0.5),
                backgroundColor: hexToRgba(accentBrand, 0.1)
              }}
            >
              Last Saved: {savedAt ?? "Never"}
            </span>
          </div>

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
                className="text-sm uppercase tracking-[0.55em] mb-3"
                style={{ color: hexToRgba(secondaryBrand, 0.9) }}
              >
                {setup?.facilityName || "BUILDER CONSOLE"}
              </p>
              <h1
                className="text-4xl font-extrabold uppercase"
                style={{
                  color: primaryBrand,
                  textShadow: `0 0 25px ${hexToRgba(primaryBrand, 0.5)}`
                }}
              >
                Exercise Builder
              </h1>
            </div>
          </header>

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
            </div>
          </section>

          <section className="space-y-6">
            {setup.stations.map((station) => {
              const options = getOptionsForEquipment(station.equipment);
              const currentSelection = selectedExercises[station.id];
              const selection = options.find((exercise) => exercise.name === currentSelection)?.name ?? options[0]?.name ?? "";

              return (
                <div
                  key={station.id}
                  className="flex flex-col gap-4 rounded-[20px] border-2 p-6 shadow-lg"
                  style={{
                    borderColor: hexToRgba(primaryBrand, 0.3),
                    backgroundColor: "rgba(0,0,0,0.6)",
                    boxShadow: `0 0 25px ${hexToRgba(primaryBrand, 0.1)}`
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p
                        className="text-sm uppercase tracking-[0.3em] font-bold mb-1"
                        style={{ color: primaryBrand }}
                      >
                        STATION {station.id}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: hexToRgba(secondaryBrand, 0.8) }}
                      >
                        Equipment: <span className="text-white font-medium">{station.equipment}</span>
                      </p>
                    </div>
                    <select
                      className="rounded-[12px] border-2 px-4 py-3 font-medium bg-black/80 sm:w-80"
                      style={{
                        borderColor: hexToRgba(accentBrand, 0.4),
                        color: "white"
                      }}
                      value={selection}
                      onChange={(event) => handleExerciseChange(station.id, event.target.value)}
                    >
                      {options.map((exercise) => (
                        <option key={exercise.name} value={exercise.name} className="bg-black">
                          {exercise.video ? "🎥 " : ""}{exercise.name}
                        </option>
                      ))}
                    </select>
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
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-[12px] px-8 py-4 font-bold uppercase tracking-[0.2em] shadow-lg border-2 disabled:opacity-60 transition-all hover:scale-105"
              style={{
                backgroundColor: primaryBrand,
                borderColor: hexToRgba(primaryBrand, 0.8),
                color: "black",
                boxShadow: `0 0 30px ${hexToRgba(primaryBrand, 0.4)}`
              }}
            >
              {isSaving ? "Saving..." : "Save & Go Live"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
