import { EXERCISE_MEDIA as EXERCISE_LIBRARY, type ExerciseMedia } from "@/lib/lib/exercise-library";
import { type WorkoutSetup, type WorkoutPlan, type StationExercise, type StationSetup } from "./storage";

export const WEEKLY_SPLIT = [
  ["legs", "quads", "glutes", "hamstrings", "calves"], // Monday
  ["core", "abs", "obliques"],                       // Tuesday
  ["arms", "biceps", "triceps", "forearms", "shoulders"], // Wednesday
  ["legs", "quads", "glutes", "hamstrings", "calves"], // Thursday
  ["back", "lats", "traps"],                          // Friday
  ["core", "arms", "chest", "total body"],           // Saturday
  ["total body", "cardio"]                             // Sunday
];

/**
 * Selects an exercise from the library based on equipment and muscle constraints.
 */
export function selectExercise(
  library: ExerciseMedia[],
  allowedEquipment: string[], 
  targetMuscles: string[], 
  excludeNames: string[] = []
): ExerciseMedia {
  // Filter library by allowed equipment and target muscles
  let candidates = library.filter((ex) => {
    const hasEquipment = allowedEquipment.some(eq => ex.equipment?.toLowerCase() === eq.toLowerCase());
    const hasMuscle = targetMuscles.length === 0 || 
                     (ex.muscles && ex.muscles.some(m => targetMuscles.includes(m.toLowerCase())));
    const isNotExcluded = !excludeNames.includes(ex.name);
    return hasEquipment && hasMuscle && isNotExcluded;
  });

  // Fallback: relax muscle constraint if no candidates found
  if (candidates.length === 0) {
    candidates = library.filter((ex) => {
      const hasEquipment = allowedEquipment.some(eq => ex.equipment?.toLowerCase() === eq.toLowerCase());
      const isNotExcluded = !excludeNames.includes(ex.name);
      return hasEquipment && isNotExcluded;
    });
  }

  // Final fallback: just pick anything from allowed equipment
  if (candidates.length === 0) {
    candidates = library.filter((ex) => 
      allowedEquipment.some(eq => ex.equipment?.toLowerCase() === eq.toLowerCase())
    );
  }

  // If still nothing, pick from the whole library (should rarely happen)
  const pool = candidates.length > 0 ? candidates : library;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Generates a fresh WorkoutPlan for the given setup and date.
 */
export function generateWorkoutPlan(
  setup: WorkoutSetup, 
  library: ExerciseMedia[],
  date: Date = new Date()
): WorkoutPlan {
  const dayIndex = (date.getDay() + 6) % 7; // Monday = 0
  const targetMuscles = WEEKLY_SPLIT[dayIndex];
  const exercises: StationExercise[] = [];
  const selectedNames: string[] = [];

  setup.stations.forEach((station) => {
    const equipmentPool = station.locked 
      ? [station.equipment] 
      : (station.allowedEquipment && station.allowedEquipment.length > 0 
          ? station.allowedEquipment 
          : [station.equipment]);

    const exerciseCount = setup.exercisesPerStation ?? (setup.mode === "studio-b" ? 2 : 1);

    for (let i = 0; i < exerciseCount; i++) {
        const ex = selectExercise(library, equipmentPool, targetMuscles, selectedNames);
        selectedNames.push(ex.name);
        
        exercises.push({
          stationId: station.id,
          name: ex.name,
          video: ex.video,
          equipment: ex.equipment,
          muscles: ex.muscles,
          cues: ex.cues,
          part: i
        });
    }
  });

  return {
    name: `Daily Burn - ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`,
    goal: "Fat Loss",
    exercises,
    studioMode: setup.mode,
    scheduledDate: date.toISOString().split('T')[0],
    isAiGenerated: true
  };
}
