"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BRAND_CACHE_KEY, BRAND_SLUG, defaultTheme, type BrandTheme } from "@/lib/brandConfig";
import { useVenueContext } from "@/lib/venue-context";

type BrandContextValue = {
  theme: BrandTheme;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveTheme: (next: BrandTheme) => Promise<void>;
  patchTheme: (partial: Partial<BrandTheme>) => Promise<void>;
  resetTheme: () => Promise<void>;
};

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

type BrandRow = {
  slug: string;
  name: string | null;
  logo_url: string | null;
  background_url: string | null;
  video_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  font_family: string | null;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const cacheKeyForSlug = (slug: string) => `${BRAND_CACHE_KEY}:${slug}`;

const rowToTheme = (row?: Partial<BrandRow> | null): BrandTheme => ({
  name: row?.name ?? defaultTheme.name,
  logoUrl: row?.logo_url ?? defaultTheme.logoUrl,
  backgroundUrl: row?.background_url ?? defaultTheme.backgroundUrl,
  videoUrl: row?.video_url ?? defaultTheme.videoUrl,
  primary: row?.primary_color ?? defaultTheme.primary,
  secondary: row?.secondary_color ?? defaultTheme.secondary,
  accent: row?.accent_color ?? defaultTheme.accent,
  font: row?.font_family ?? defaultTheme.font,
});

const themeToRow = (theme: BrandTheme, slug: string) => ({
  slug,
  name: theme.name,
  logo_url: theme.logoUrl,
  background_url: theme.backgroundUrl,
  video_url: theme.videoUrl ?? defaultTheme.videoUrl,
  primary_color: theme.primary,
  secondary_color: theme.secondary,
  accent_color: theme.accent,
  font_family: theme.font,
});

const persistThemeToCssVars = (theme: BrandTheme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--brand-primary", theme.primary);
  root.style.setProperty("--brand-secondary", theme.secondary);
  root.style.setProperty("--brand-accent", theme.accent);
  root.style.setProperty("--brand-font", theme.font);
  root.style.setProperty("--brand-background", `url(${theme.backgroundUrl})`);
};

const readCachedTheme = (slug: string): BrandTheme => {
  if (typeof window === "undefined") return defaultTheme;
  try {
    const cache = window.localStorage.getItem(cacheKeyForSlug(slug));
    if (!cache) return defaultTheme;
    return { ...defaultTheme, ...JSON.parse(cache) } as BrandTheme;
  } catch {
    return defaultTheme;
  }
};

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const { activeVenue } = useVenueContext();
  const derivedSlug = useMemo(() => {
    if (!activeVenue) return BRAND_SLUG;
    if (activeVenue.id) return slugify(activeVenue.id);
    if (activeVenue.name) return slugify(activeVenue.name);
    return BRAND_SLUG;
  }, [activeVenue]);

  const slugRef = useRef(derivedSlug);
  useEffect(() => {
    slugRef.current = derivedSlug;
  }, [derivedSlug]);

  const [theme, setTheme] = useState<BrandTheme>(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel>>();
  const brandTableUnavailableRef = useRef(false);

  const applyTheme = useCallback((next: BrandTheme, slug: string) => {
    setTheme(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(cacheKeyForSlug(slug), JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
    }
    persistThemeToCssVars(next);
  }, []);

  const fetchTheme = useCallback(async (slug: string) => {
    if (brandTableUnavailableRef.current) {
      setLoading(false);
      setError("Brand settings table missing (fallback to default theme).");
      applyTheme(defaultTheme, slug);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("brand_settings")
      .select("slug,name,logo_url,background_url,video_url,primary_color,secondary_color,accent_color,font_family")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Brand theme load failed", error);
      const isMissingTable =
        error.code === "PGRST205" ||
        (typeof error.details === "string" && error.details.includes("brand_settings"));
      if (isMissingTable) {
        brandTableUnavailableRef.current = true;
        setError("Brand settings table missing (fallback to default theme).");
      } else {
        setError("Unable to load brand theme");
      }
      applyTheme(defaultTheme, slug);
      if (slugRef.current === slug) setLoading(false);
      return;
    }

    if (!data) {
      await supabase.from("brand_settings").upsert(themeToRow(defaultTheme, slug), { onConflict: "slug" });
      applyTheme(defaultTheme, slug);
      if (slugRef.current === slug) setLoading(false);
      return;
    }

    const next = rowToTheme(data);
    applyTheme(next, slug);
    if (slugRef.current === slug) setLoading(false);
  }, [applyTheme]);

  useEffect(() => {
    setTheme(readCachedTheme(derivedSlug));
    fetchTheme(derivedSlug);
  }, [derivedSlug, fetchTheme]);

  useEffect(() => {
    if (brandTableUnavailableRef.current) return;

    const channel = supabase
      .channel(`brand_settings_stream_${derivedSlug}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brand_settings", filter: `slug=eq.${derivedSlug}` },
        (payload) => {
          if (payload.new) {
            applyTheme(rowToTheme(payload.new as BrandRow), derivedSlug);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channelRef.current = channel;
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = undefined;
    };
  }, [derivedSlug, applyTheme]);

  const saveTheme = useCallback(
    async (next: BrandTheme) => {
      const targetSlug = slugRef.current;
      applyTheme(next, targetSlug);
      const { error } = await supabase.from("brand_settings").upsert(themeToRow(next, targetSlug), { onConflict: "slug" }).select();
      if (error) {
        console.error("Failed to save brand theme", error);
        setError("Unable to save brand theme");
      }
    },
    [applyTheme]
  );

  const patchTheme = useCallback(
    async (partial: Partial<BrandTheme>) => {
      await saveTheme({ ...theme, ...partial });
    },
    [saveTheme, theme]
  );

  const resetTheme = useCallback(async () => {
    await saveTheme(defaultTheme);
  }, [saveTheme]);

  const value = useMemo(
    () => ({
      theme,
      loading,
      error,
      refresh: fetchTheme,
      saveTheme,
      patchTheme,
      resetTheme,
    }),
    [theme, loading, error, fetchTheme, saveTheme, patchTheme, resetTheme]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrandThemeContext() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrandThemeContext must be used within BrandProvider");
  }
  return context;
}
