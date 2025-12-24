"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  storage,
  VENUES_UPDATED_EVENT,
  type VenueProfile,
} from "@/lib/workout-engine/storage";

type VenueContextValue = {
  venues: VenueProfile[];
  activeVenue: VenueProfile | null;
  setActiveVenueId: (id: string | null) => void;
  refreshVenues: () => void;
};

const VenueContext = createContext<VenueContextValue | undefined>(undefined);

export function VenueProvider({ children }: { children: React.ReactNode }) {
  const [venues, setVenues] = useState<VenueProfile[]>(() => storage.getVenues());
  const [activeVenue, setActiveVenue] = useState<VenueProfile | null>(() =>
    storage.getActiveVenue()
  );

  const refreshVenues = useCallback(() => {
    const nextVenues = storage.getVenues();
    setVenues(nextVenues);
    setActiveVenue(storage.getActiveVenue());
  }, []);

  const handleSetActiveVenueId = useCallback((id: string | null) => {
    storage.setActiveVenueId(id);
    refreshVenues();
  }, [refreshVenues]);

  useEffect(() => {
    const handleUpdate = () => refreshVenues();
    window.addEventListener(VENUES_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(VENUES_UPDATED_EVENT, handleUpdate);
  }, [refreshVenues]);

  // Inject Brand Colors
  useEffect(() => {
    const root = document.documentElement;
    const colors = activeVenue?.colors;

    if (colors) {
      if (colors.primary) root.style.setProperty("--brand-primary", colors.primary);
      if (colors.secondary) root.style.setProperty("--brand-secondary", colors.secondary);
      if (colors.accent) root.style.setProperty("--brand-accent", colors.accent);
    } else {
      // Reset to defaults if no venue overrides (optional, or let CSS defaults take over)
      // We leave them as is to fall back to the CSS :root defaults, 
      // or we could explicitly reset them if we want to support "switching back" to default.
      // For now, let's assume the CSS :root has the "Luxury" defaults.
      root.style.removeProperty("--brand-primary");
      root.style.removeProperty("--brand-secondary");
      root.style.removeProperty("--brand-accent");
    }
  }, [activeVenue]);

  const value = useMemo(
    () => ({
      venues,
      activeVenue,
      setActiveVenueId: handleSetActiveVenueId,
      refreshVenues,
    }),
    [venues, activeVenue, handleSetActiveVenueId, refreshVenues]
  );

  return <VenueContext.Provider value={value}>{children}</VenueContext.Provider>;
}

export function useVenueContext() {
  const context = useContext(VenueContext);
  if (!context) {
    throw new Error("useVenueContext must be used within a VenueProvider");
  }
  return context;
}
