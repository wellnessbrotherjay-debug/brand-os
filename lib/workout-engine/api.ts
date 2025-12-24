import { supabase } from "@/lib/supabase";
import type { StoredWorkout } from "./types";

export const DEFAULT_WORK_DURATION = 45;
export const DEFAULT_REST_DURATION = 15;
export const DEFAULT_ROUNDS = 3;

interface WorkoutRecord extends Record<string, unknown> {
  id: string;
  payload?: StoredWorkout;
  data?: StoredWorkout;
  rounds?: number;
  work_duration?: number;
  rest_duration?: number;
}

export interface NormalizedWorkout extends StoredWorkout {
  rounds: number;
  workDuration: number;
  restDuration: number;
}

function normalizeWorkout(record: WorkoutRecord): NormalizedWorkout | null {
  const payload =
    (record.payload as StoredWorkout | undefined) ??
    (record.data as StoredWorkout | undefined);

  const base =
    payload ??
    ({
      goal: "",
      warmUp: null,
      stations: [],
    } as StoredWorkout);

  return {
    id: record.id ?? base.id,
    goal: base.goal ?? "",
    warmUp: base.warmUp ?? null,
    stations: base.stations ?? [],
    rounds:
      record.rounds ??
      base.rounds ??
      (typeof (record as Record<string, unknown>).rounds === "number"
        ? ((record as Record<string, number>).rounds as number)
        : DEFAULT_ROUNDS),
    workDuration:
      record.work_duration ??
      base.workDuration ??
      DEFAULT_WORK_DURATION,
    restDuration:
      record.rest_duration ??
      base.restDuration ??
      DEFAULT_REST_DURATION,
  };
}

export async function fetchWorkoutById(
  workoutId: string
): Promise<{ workout: NormalizedWorkout | null; error?: string }> {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", workoutId)
    .maybeSingle();

  if (error) {
    return { workout: null, error: error.message };
  }

  if (!data) {
    return { workout: null, error: "Workout not found" };
  }

  const normalized = normalizeWorkout(data);

  if (!normalized) {
    return { workout: null, error: "Invalid workout payload" };
  }

  return { workout: normalized };
}
