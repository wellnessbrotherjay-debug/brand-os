"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Exercise {
  name: string;
  equipment: string;
  category?: string;
}

interface WorkoutPlan {
  warmUp: Exercise | null;
  stations: { station: number; exercise: Exercise | null }[];
}

export default function WorkoutPreviewPage() {
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("currentWorkout");
      if (stored) {
        const parsed = JSON.parse(stored) as WorkoutPlan;
        setWorkout(parsed);
      }
    } catch (error) {
      console.error("Failed to load workout from storage", error);
    }
  }, []);

  if (!workout) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-12 text-neutral-100">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <p className="text-neutral-400">
            No workout found. Head back to the builder to generate a new one.
          </p>
          <Link
            href="/builder"
            className="rounded-md bg-[#00BFFF] px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-[#0095d8]"
          >
            Back to Builder
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-neutral-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-[#F4D03F]">Workout Preview</h1>
          <p className="text-sm text-neutral-400">
            Review your assigned exercises before launching the session.
          </p>
        </header>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6">
          <h2 className="text-xl font-semibold text-[#00BFFF]">Warm-Up</h2>
          <p className="mt-3 text-lg text-neutral-200">
            {workout.warmUp?.name ?? "No warm-up assigned"}
          </p>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6">
          <h2 className="text-xl font-semibold text-[#F4D03F]">Stations</h2>
          <div className="mt-4 space-y-3">
            {workout.stations.map(({ station, exercise }) => (
              <div
                key={station}
                className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/60 px-4 py-3"
              >
                <span className="text-sm font-medium text-neutral-300">
                  Station {station}
                </span>
                <span className="text-sm text-neutral-100">
                  {exercise?.name ?? "No exercise assigned"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
