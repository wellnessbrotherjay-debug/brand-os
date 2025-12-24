import type { BrandPalette, WorkoutSetup, VenueProfile } from "@/lib/workout-engine/storage";
import { getDefaultBrandColors } from "@/lib/workout-engine/storage";

interface ResolveBrandColorArgs {
  activeVenue?: VenueProfile | null;
  setup?: WorkoutSetup | null;
  fallback?: BrandPalette;
}

export function resolveBrandColors({
  activeVenue,
  setup,
  fallback,
}: ResolveBrandColorArgs = {}): BrandPalette {
  const themeDefaults = getDefaultBrandColors(setup?.theme);
  const palette = activeVenue?.colors ?? setup?.colors ?? fallback ?? themeDefaults;

  return {
    primary: palette.primary || themeDefaults.primary,
    secondary: palette.secondary || themeDefaults.secondary,
    accent: palette.accent || themeDefaults.accent,
  };
}
