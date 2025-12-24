"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_ROOM_WORKOUTS,
  loadRoomWorkoutLibrary,
  saveRoomWorkoutLibrary,
  type RoomWorkoutCategory,
  type RoomWorkoutEntry,
  ROOM_WORKOUT_CATEGORIES,
} from "@/lib/room-workout-library";

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `entry-${Date.now()}`;
};

export default function RoomWorkoutBuilderPage() {
  const [library, setLibrary] = useState<RoomWorkoutEntry[]>(DEFAULT_ROOM_WORKOUTS);
  const [selectedCategory, setSelectedCategory] = useState<RoomWorkoutCategory>(
    ROOM_WORKOUT_CATEGORIES[0],
  );
  const [form, setForm] = useState({
    category: ROOM_WORKOUT_CATEGORIES[0],
    title: "",
    duration: "10 min",
    notes: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = loadRoomWorkoutLibrary();
    setLibrary(stored);
    setSelectedCategory(ROOM_WORKOUT_CATEGORIES[0]);
    setForm((prev) => ({ ...prev, category: ROOM_WORKOUT_CATEGORIES[0] }));
  }, []);

  useEffect(() => {
    saveRoomWorkoutLibrary(library);
  }, [library]);

  const entriesForCategory = library.filter((entry) => entry.category === selectedCategory);
  const totalEntries = useMemo(() => library.length, [library]);

  const handleAddEntry = () => {
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) return;
    const nextEntry: RoomWorkoutEntry = {
      id: generateId(),
      title: trimmedTitle,
      duration: form.duration || "10 min",
      description: form.notes.trim(),
      category: form.category,
    };
    setLibrary((prev) => [...prev, nextEntry]);
    setSelectedCategory(form.category);
    setForm((prev) => ({ ...prev, title: "", notes: "" }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-200">Room Workout Builder</p>
          <h1 className="text-4xl font-semibold">Curate the hotel room library</h1>
          <p className="mx-auto max-w-2xl text-base text-slate-300">
            Organize workouts, stretches, meditations, and relax rituals for every suite. Save
            experiences to launch from the welcome hub or hospitality suites.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.4em]">
            <Link
              href="/welcome"
              className="rounded-full border border-white/40 px-4 py-2 text-white transition hover:border-white"
            >
              Return to welcome
            </Link>
            <Link
              href="/tv/workout"
              className="rounded-full border border-emerald-400 px-4 py-2 text-emerald-200 transition hover:bg-emerald-500/20"
            >
              Preview a room workout
            </Link>
          </div>
        </header>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Categories</p>
              <h2 className="text-2xl font-semibold text-white">Select a focus</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {ROOM_WORKOUT_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setForm((prev) => ({ ...prev, category }));
                  }}
                  className={`rounded-full border px-4 py-1 text-xs uppercase tracking-[0.3em] transition ${
                    selectedCategory === category
                      ? "border-emerald-400 bg-emerald-600/20 text-emerald-200"
                      : "border-white/20 text-slate-200 hover:border-emerald-400/40"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Library</p>
              <h3 className="text-2xl font-semibold text-white">{selectedCategory} picks</h3>
            </div>
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.4em] text-white/80">
              {totalEntries} entries
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {entriesForCategory.length ? (
              entriesForCategory.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80"
                >
                  <div className="text-lg font-semibold text-white">{entry.title}</div>
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-emerald-300">{entry.duration}</p>
                  <p className="mt-3 text-sm text-white/70">{entry.description}</p>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-400">Add your first experience for this focus.</p>
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/70 p-6 shadow-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Add a new experience</p>
            <h3 className="text-2xl font-semibold text-white">Build a hotel room ritual</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <label className="space-y-1 text-xs uppercase tracking-[0.3em] text-white/70">
              Category
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, category: event.target.value as RoomWorkoutCategory }))
                }
                className="w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white outline-none"
              >
                {ROOM_WORKOUT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.3em] text-white/70 md:col-span-3">
              Title
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="e.g., Traveler's Flow"
                className="w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white outline-none"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-xs uppercase tracking-[0.3em] text-white/70">
              Duration
              <input
                value={form.duration}
                onChange={(event) => setForm((prev) => ({ ...prev, duration: event.target.value }))}
                placeholder="12 min"
                className="w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white outline-none"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.3em] text-white/70">
              Notes / cues
              <input
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Focus on breath, pacing, or emotion."
                className="w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white outline-none"
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddEntry}
              className="rounded-full border border-emerald-400 px-6 py-3 text-xs uppercase tracking-[0.4em] text-emerald-200 transition hover:bg-emerald-500/20"
            >
              Save to library
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
