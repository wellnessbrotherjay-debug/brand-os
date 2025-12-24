"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_EXERCISE_MEDIA,
  type ExerciseMedia,
} from "@/lib/lib/exercise-library";
import { useVenueContext } from "@/lib/venue-context";
import {
  loadVenueLibrary,
  type VenueLibraryRecord,
} from "@/lib/workout-engine/venue-library";

export function mapExerciseLibraryRecord(record: VenueLibraryRecord): ExerciseMedia {
  const metadata = (record.metadata ?? {}) as Record<string, any>;
  const muscles = Array.isArray(metadata.muscles) ? metadata.muscles : undefined;
  let cues: string[] | undefined;
  if (Array.isArray(metadata.cues)) {
    cues = metadata.cues;
  } else if (typeof record.instructions === "string") {
    cues = record.instructions
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  const fallbackEquipment =
    typeof metadata.equipment === "string" ? metadata.equipment : "dumbbells";

  return {
    name: record.name,
    equipment: record.equipment ?? fallbackEquipment,
    video: record.video_url ?? record.media_url ?? "",
    muscles,
    cues,
  };
}

export function useExerciseMediaLibrary() {
  const { activeVenue } = useVenueContext();
  const [library, setLibrary] = useState<ExerciseMedia[]>(DEFAULT_EXERCISE_MEDIA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchLibrary() {
      setIsLoading(true);
      try {
        const records = await loadVenueLibrary("exercise", { venueId: activeVenue?.id ?? null });
        if (cancelled) return;
        if (records.length) {
          setLibrary(records.map(mapExerciseLibraryRecord));
          setError(null);
        } else {
          setLibrary(DEFAULT_EXERCISE_MEDIA);
          setError("No exercises found for this venue. Showing defaults.");
        }
      } catch (err) {
        console.error("Failed to load venue exercise library", err);
        if (!cancelled) {
          setLibrary(DEFAULT_EXERCISE_MEDIA);
          setError("Unable to load venue exercise library. Showing defaults.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchLibrary();
    return () => {
      cancelled = true;
    };
  }, [activeVenue?.id]);

  const lookup = useMemo(() => {
    return new Map(library.map((item) => [item.name.toLowerCase(), item]));
  }, [library]);

  return {
    library,
    lookup,
    isLoading,
    error,
  };
}
