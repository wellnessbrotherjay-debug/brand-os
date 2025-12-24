"use client";

import { useBrandThemeContext } from "@/lib/brand-context";
import { defaultTheme, type BrandTheme as BrandSettings } from "@/lib/brandConfig";

export type { BrandSettings };
export const DEFAULT_BRAND = defaultTheme;

export function useBranding() {
  const { theme, loading, error, refresh, saveTheme, patchTheme, resetTheme } = useBrandThemeContext();

  const saveBrand = async (next: BrandSettings) => {
    await saveTheme(next);
  };

  const resetBrand = async () => {
    await resetTheme();
  };

  return {
    brand: theme,
    ready: !loading,
    loading,
    error,
    refreshBrand: refresh,
    saveBrand,
    updateBrand: patchTheme,
    resetBrand,
  };
}
