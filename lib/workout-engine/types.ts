export interface WorkoutExercise {
  name: string;
  equipment: string;
  category?: string;
}

export interface WorkoutStation {
  station: number;
  equipment: string;
  exercise: WorkoutExercise | null;
}

export interface StoredWorkout {
  id?: string;
  goal: string;
  warmUp: WorkoutExercise | null;
  stations: WorkoutStation[];
  rounds?: number;
  workDuration?: number;
  restDuration?: number;
}
