"use client";

import Link from "next/link";
import { useState } from "react";

type EquipmentOption =
  | "dumbbells"
  | "mat"
  | "trx"
  | "treadmill"
  | "bike"
  | "box"
  | "bodyweight"
  | string;

interface Exercise {
  name: string;
  equipment: EquipmentOption;
}

interface WorkoutStation {
  station: number;
  equipment: EquipmentOption;
  exercise: Exercise | null;
}

interface WorkoutPayload {
  goal: string;
  warmUp: Exercise | null;
  stations: WorkoutStation[];
}

const WORKOUT_KEY = "currentWorkout";

export default function TvPreviewPage() {
  const [workout] = useState<WorkoutPayload | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const stored = window.localStorage.getItem(WORKOUT_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as WorkoutPayload;
      return parsed?.stations?.length ? parsed : null;
    } catch (error) {
      console.error("Failed to load workout from storage", error);
      return null;
    }
  });

  if (!workout) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-12 text-neutral-100">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-8 text-center">
          <p className="text-neutral-300">Nothing to preview.</p>
          <Link
            href="/builder"
            className="rounded-md bg-[#F4D03F] px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-[#d4b538]"
          >
            Back to Builder
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,191,255,0.08),_rgba(0,0,0,0.92))] px-6 py-12 text-neutral-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 rounded-3xl border border-[#F4D03F]/40 bg-neutral-950/80 p-10 shadow-[0_0_65px_rgba(244,208,63,0.25)]">
        <header className="flex flex-col gap-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#00BFFF]">
            MGM HOTEL TRAINING SUITE
          </p>
          <h1 className="text-4xl font-black tracking-[0.35em] text-[#F4D03F]">
            WARRIOR DISPLAY
          </h1>
          <p className="text-sm uppercase text-neutral-400">
            Goal Focus: {workout.goal}
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <section className="flex flex-col gap-4 rounded-2xl border border-[#00BFFF]/40 bg-neutral-900/70 p-6 shadow-[0_0_35px_rgba(0,191,255,0.25)]">
            <h2 className="text-xl font-semibold uppercase tracking-[0.25em] text-[#F4D03F]">
              Warm-Up
            </h2>
            <p className="text-lg text-neutral-200">
              {workout.warmUp?.name ?? "No warm-up assigned"}
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Equipment: {workout.warmUp?.equipment ?? "bodyweight"}
            </p>
          </section>

          <section className="rounded-2xl border border-[#F4D03F]/30 bg-neutral-900/70 p-8 shadow-[0_0_35px_rgba(244,208,63,0.2)]">
            <h2 className="text-center text-xl font-semibold uppercase tracking-[0.3em] text-[#F4D03F]">
              Station Lineup
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {workout.stations.map(({ station, exercise }) => (
                <div
                  key={station}
                  className="rounded-xl border border-[#F4D03F]/50 bg-neutral-950/70 p-6 text-center shadow-[0_0_25px_rgba(244,208,63,0.2)]"
                >
                  <p className="text-xs uppercase tracking-[0.35em] text-[#00BFFF]">
                    Station {station}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-[#F4D03F]">
                    {exercise?.name ?? "Pending"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
