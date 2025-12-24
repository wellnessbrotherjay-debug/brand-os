export type RoomWorkoutCategory = "Workout" | "Stretch" | "Meditation" | "Relax";

export type RoomWorkoutEntry = {
  id: string;
  title: string;
  category: RoomWorkoutCategory;
  duration: string;
  description: string;
};

export const ROOM_WORKOUT_CATEGORIES: RoomWorkoutCategory[] = [
  "Workout",
  "Stretch",
  "Meditation",
  "Relax",
];

export const DEFAULT_ROOM_WORKOUTS: RoomWorkoutEntry[] = [
  {
    id: "hotel-workout-1",
    title: "Sunrise Power Flow",
    category: "Workout",
    duration: "28 min",
    description: "Dynamic cardio and strength stations to kick off the day.",
  },
  {
    id: "hotel-workout-2",
    title: "Circuit Core Reset",
    category: "Workout",
    duration: "22 min",
    description: "Low-impact circuits that center on breath and balance for travel recovery.",
  },
  {
    id: "hotel-workout-3",
    title: "Cirrus Stretch Sequence",
    category: "Stretch",
    duration: "18 min",
    description: "Full-body mobility work to release stiff joints after flying.",
  },
  {
    id: "hotel-workout-4",
    title: "Lounge Unwind Stretch",
    category: "Stretch",
    duration: "15 min",
    description: "Gentle mat and chair flows for guests settling into the suite.",
  },
  {
    id: "hotel-workout-5",
    title: "Guided Deep Meditation",
    category: "Meditation",
    duration: "12 min",
    description: "Focused breathing with oceanic ambiance to calm the mind.",
  },
  {
    id: "hotel-workout-6",
    title: "Luminous Breathwork",
    category: "Meditation",
    duration: "10 min",
    description: "Centered pranayama cues narrated in a spa-inspired tone.",
  },
  {
    id: "hotel-workout-7",
    title: "Relax & Restore Lounge",
    category: "Relax",
    duration: "20 min",
    description: "Ambient slow movement with restorative holds and soft cues.",
  },
  {
    id: "hotel-workout-8",
    title: "Candlelit Calm Ritual",
    category: "Relax",
    duration: "16 min",
    description: "Wind-down ritual that guides guests toward a serene night.",
  },
];

const STORAGE_KEY = "hotel-room-workout-library";

export function loadRoomWorkoutLibrary(): RoomWorkoutEntry[] {
  if (typeof window === "undefined") return DEFAULT_ROOM_WORKOUTS;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ROOM_WORKOUTS));
      return DEFAULT_ROOM_WORKOUTS;
    }
    const parsed = JSON.parse(stored) as RoomWorkoutEntry[];
    if (!Array.isArray(parsed) || !parsed.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ROOM_WORKOUTS));
      return DEFAULT_ROOM_WORKOUTS;
    }
    return parsed;
  } catch (error) {
    console.error("Failed to load room workout library", error);
    return DEFAULT_ROOM_WORKOUTS;
  }
}

export function saveRoomWorkoutLibrary(entries: RoomWorkoutEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Failed to save room workout library", error);
  }
}
