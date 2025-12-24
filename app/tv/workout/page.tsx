"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resolveBrandColors } from "@/lib/workout-engine/brand-colors";
import { storage } from "@/lib/workout-engine/storage";
import { useVenueContext } from "@/lib/venue-context";
import {
  loadRoomWorkoutLibrary,
  type RoomWorkoutCategory,
  type RoomWorkoutEntry,
  ROOM_WORKOUT_CATEGORIES,
} from "@/lib/room-workout-library";

const CATEGORY_TEASERS: Record<RoomWorkoutCategory, string> = {
  Workout: "High-energy flows, circuits, and strength cues to energize every guest.",
  Stretch: "Slow, travel-friendly mobility for tired joints and tight hips.",
  Meditation: "Guided breath and mindset routines for calm focus.",
  Relax: "Restorative rituals with ambient cues to encourage deep recovery.",
};

export default function RoomWorkoutDisplay() {
  const [setup, setSetup] = useState(null);
  const [roomWorkouts, setRoomWorkouts] = useState<RoomWorkoutEntry[]>(loadRoomWorkoutLibrary());
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(
    roomWorkouts[0]?.id ?? null,
  );
  const searchParams = useSearchParams();
  const { activeVenue } = useVenueContext();

  useEffect(() => {
    setSetup(storage.getSetup());
  }, []);

  useEffect(() => {
    setRoomWorkouts(loadRoomWorkoutLibrary());
  }, []);

  useEffect(() => {
    if (!roomWorkouts.length) {
      setSelectedWorkoutId(null);
      return;
    }
    const highlight = searchParams.get("highlight");
    if (highlight && roomWorkouts.some((entry) => entry.id === highlight)) {
      setSelectedWorkoutId(highlight);
      return;
    }
    setSelectedWorkoutId((prev) =>
      prev && roomWorkouts.some((entry) => entry.id === prev)
        ? prev
        : roomWorkouts[0].id,
    );
  }, [roomWorkouts, searchParams]);

  const selectedWorkout = roomWorkouts.find((entry) => entry.id === selectedWorkoutId) ?? roomWorkouts[0] ?? null;

  const brandColors = useMemo(
    () => resolveBrandColors({ activeVenue, setup }),
    [activeVenue, setup],
  );

  const groupedWorkouts = useMemo(() => {
    return ROOM_WORKOUT_CATEGORIES.reduce((acc, category) => {
      acc[category] = roomWorkouts.filter((entry) => entry.category === category);
      return acc;
    }, {} as Record<RoomWorkoutCategory, RoomWorkoutEntry[]>);
  }, [roomWorkouts]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#030510] to-[#0E1724] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-10 lg:px-6">
        <header className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Room Workout Library</p>
          <h1 className="text-4xl font-semibold">Hotel routines ready on your welcome TV</h1>
          <p className="mx-auto max-w-2xl text-base text-slate-300">
            Every workout, stretch, meditation, and relax ritual curated in one place—tap a routine and it will
            highlight on the welcome screen.
          </p>
          {selectedWorkout && (
            <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-black/60 p-6 text-left shadow-xl">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Currently highlighted</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">{selectedWorkout.title}</h2>
                  <p className="mt-1 text-sm text-slate-300">{selectedWorkout.description}</p>
                </div>
                <span
                  className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-200"
                  style={{ color: brandColors.secondary }}
                >
                  Duration · {selectedWorkout.duration}
                </span>
              </div>
            </div>
          )}
        </header>

        <section className="space-y-8">
          {ROOM_WORKOUT_CATEGORIES.map((category) => {
            const entries = groupedWorkouts[category] ?? [];
            if (!entries.length) return null;
            return (
              <article
                key={category}
                className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{category}</p>
                    <h3 className="text-2xl font-semibold text-white">{category} routines</h3>
                    <p className="mt-2 text-sm text-slate-300">{CATEGORY_TEASERS[category]}</p>
                  </div>
                  <span className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
                    {entries.length} saved
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {entries.map((entry) => {
                    const isSelected = entry.id === selectedWorkoutId;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => setSelectedWorkoutId(entry.id)}
                        className={`flex flex-col gap-3 rounded-2xl border p-5 text-left transition ${
                          isSelected
                            ? "border-sky-400 bg-sky-500/10 text-white"
                            : "border-white/10 bg-black/40 hover:border-sky-400/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-semibold">{entry.title}</h4>
                          <span className="text-xs uppercase tracking-[0.3em] text-emerald-300">
                            {entry.duration}
                          </span>
                        </div>
                        <p className="text-sm text-white/70">{entry.description}</p>
                        <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                          {isSelected ? "Highlighted on TV" : "Tap to highlight"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
