import {
  EXERCISE_MEDIA,
  FALLBACK_EXERCISE_VIDEO,
  getMediaForExercise,
  type ExerciseMedia,
} from "@/lib/lib/exercise-library";
import type { StationExercise } from "./storage";

type ResolveExerciseOptions = {
  library?: ExerciseMedia[];
};

export function resolveExerciseMedia(
  exercise?: StationExercise | null,
  options: ResolveExerciseOptions = {}
): ExerciseMedia | null {
  if (!exercise) return null;
  const activeLibrary = options.library ?? EXERCISE_MEDIA;
  const fallbackMedia =
    activeLibrary.find((entry) => entry.name.toLowerCase() === exercise.name.toLowerCase()) ??
    getMediaForExercise(exercise.name);
  const storedVideo = exercise.video ?? null;
  const fallbackVideo = fallbackMedia?.video ?? null;
  const isLocalVideo = storedVideo?.startsWith("/videos/");
  const shouldPreferFallback =
    Boolean(fallbackVideo) && (!storedVideo || (isLocalVideo && storedVideo !== fallbackVideo));
  const resolvedVideo = shouldPreferFallback
    ? fallbackVideo
    : storedVideo ?? fallbackVideo ?? FALLBACK_EXERCISE_VIDEO;

  return {
    name: exercise.name,
    equipment: exercise.equipment ?? fallbackMedia?.equipment ?? "Configured in Builder",
    video: resolvedVideo,
    muscles: exercise.muscles ?? fallbackMedia?.muscles,
    cues: exercise.cues ?? fallbackMedia?.cues,
  };
}

export { EXERCISE_MEDIA, FALLBACK_EXERCISE_VIDEO, getMediaForExercise };
