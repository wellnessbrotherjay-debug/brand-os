import type { EquipmentOption } from "./constants";
import { EXERCISE_MEDIA as EXERCISE_LIBRARY, type ExerciseMedia } from "@/lib/lib/exercise-library";
import type { FontSettings } from "./branding";

export interface BrandPalette {
  primary: string;
  secondary: string;
  accent: string;
}

export interface StationSetup {
  id: number;
  equipment: EquipmentOption;
}

export interface WorkoutSetup {
  stations: StationSetup[];
  logo: string | null;
  theme: string;
  workTime: number;
  restTime: number;
  rounds: number;
  facilityName?: string;
  colors?: BrandPalette;
  quote?: string;
  fonts?: FontSettings;
}

export const DEFAULT_STATIONS: StationSetup[] = Array.from({ length: 6 }, (_, index) => ({
  id: index + 1,
  equipment: "bodyweight",
}));

export const DEFAULT_SETUP: WorkoutSetup = {
  facilityName: "Hotel Fit Solutionss",
  stations: DEFAULT_STATIONS,
  logo: "https://r2.erweima.ai/img/compressed/378812c3f156687071e2170364d93026.png",
  theme: "Gold",
  workTime: 45,
  restTime: 15,
  rounds: 1,
  colors: {
    primary: "#0A84FF",
    secondary: "#38D9A9",
    accent: "#FFB703",
  },
};

export interface StationExercise {
  stationId: number;
  name: string;
  video?: string | null;
  equipment?: string | null;
  muscles?: string[];
  cues?: string[];
}

export interface WorkoutPlan {
  goal: "Fat Loss" | "Strength" | "Endurance";
  exercises: StationExercise[];
}

export interface VenueProfile {
  id: string;
  name: string;
  logo?: string | null;
  colors: BrandPalette;
  createdAt: number;
}

export type NewVenuePayload = {
  name: string;
  logo?: string | null;
  colors: BrandPalette;
};

export type VenueUpdatePayload = {
  name?: string;
  logo?: string | null;
  colors?: BrandPalette;
};

export type SessionPhase = "prep" | "work" | "rest" | "complete";

export interface SessionState {
  stationId: number;
  round: number;
  phase: SessionPhase;
  remaining: number;
  updatedAt: number;
}

export const STORAGE_KEYS = {
  setup: "workoutSetup",
  plan: "workoutPlan",
  session: "workoutSessionState",
  venues: "workoutVenues",
  activeVenueId: "activeVenueId",
} as const;

function buildFallbackPlan(stations: StationSetup[] = DEFAULT_SETUP.stations): WorkoutPlan {
  const safeStations = stations.length ? stations : DEFAULT_STATIONS;
  const exercises = safeStations.map((station, index) => {
    const exercise = EXERCISE_LIBRARY[index % EXERCISE_LIBRARY.length];
    return {
      stationId: station.id,
      name: exercise.name,
      video: exercise.video,
      equipment: exercise.equipment,
      muscles: exercise.muscles,
      cues: exercise.cues,
    };
  });
  return {
    goal: "Fat Loss",
    exercises,
  };
}

export const VENUES_UPDATED_EVENT = "venuesUpdated";

function readJSONKey<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Failed to read ${key}`, error);
    return null;
  }
}

function writeJSONKey<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to write ${key}`, error);
  }
}

function removeKey(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove ${key}`, error);
  }
}

function readValue(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to read ${key}`, error);
    return null;
  }
}

function writeValue(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch (error) {
    console.error(`Failed to write ${key}`, error);
  }
}

function generateId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}`;
}

function emitVenueUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(VENUES_UPDATED_EVENT));
}

function getScopedStorageKey(baseKey: string, venueId: string | null = getActiveVenueIdInternal()) {
  if (!venueId) return baseKey;
  return `${baseKey}::${venueId}`;
}

function readScopedJSON<T>(baseKey: string): T | null {
  const scopedKey = getScopedStorageKey(baseKey);
  const scopedValue = readJSONKey<T>(scopedKey);
  if (scopedValue !== null) return scopedValue;

  if (scopedKey !== baseKey) {
    const legacyValue = readJSONKey<T>(baseKey);
    if (legacyValue !== null) {
      writeJSONKey(scopedKey, legacyValue);
      return legacyValue;
    }
  }

  return null;
}

function writeScopedJSON<T>(baseKey: string, value: T) {
  const scopedKey = getScopedStorageKey(baseKey);
  writeJSONKey(scopedKey, value);
}

function removeScopedValue(baseKey: string) {
  const scopedKey = getScopedStorageKey(baseKey);
  removeKey(scopedKey);
}

function getStoredVenues(): VenueProfile[] {
  return readJSONKey<VenueProfile[]>(STORAGE_KEYS.venues) ?? [];
}

function persistVenues(next: VenueProfile[]) {
  writeJSONKey(STORAGE_KEYS.venues, next);
  emitVenueUpdate();
}

function createVenueInternal(payload: NewVenuePayload): VenueProfile | null {
  if (!payload.name?.trim()) return null;
  const venues = getStoredVenues();
  const newVenue: VenueProfile = {
    id: generateId("venue"),
    name: payload.name.trim(),
    logo: payload.logo?.trim() || null,
    colors: payload.colors,
    createdAt: Date.now(),
  };
  persistVenues([...venues, newVenue]);
  setActiveVenueIdInternal(newVenue.id);
  return newVenue;
}

function updateVenueInternal(id: string, updates: VenueUpdatePayload): VenueProfile | null {
  if (!id) return null;
  const venues = getStoredVenues();
  const index = venues.findIndex((venue) => venue.id === id);
  if (index === -1) return null;

  const nextVenue: VenueProfile = {
    ...venues[index],
    name: updates.name?.trim() || venues[index].name,
    logo:
      updates.logo === undefined
        ? venues[index].logo
        : (updates.logo?.trim() || null),
    colors: updates.colors ?? venues[index].colors,
  };

  const nextVenues = [...venues];
  nextVenues[index] = nextVenue;
  persistVenues(nextVenues);
  return nextVenue;
}

function deleteVenueInternal(id: string) {
  if (!id) return;
  const venues = getStoredVenues();
  const nextVenues = venues.filter((venue) => venue.id !== id);
  if (nextVenues.length === venues.length) return;
  persistVenues(nextVenues);
  const activeId = getActiveVenueIdInternal();
  if (activeId === id) {
    setActiveVenueIdInternal(nextVenues[0]?.id ?? null);
  }
}

function getActiveVenueIdInternal(): string | null {
  return readValue(STORAGE_KEYS.activeVenueId);
}

function setActiveVenueIdInternal(id: string | null) {
  writeValue(STORAGE_KEYS.activeVenueId, id);
  emitVenueUpdate();
}

function getActiveVenueInternal(): VenueProfile | null {
  const venues = getStoredVenues();
  const activeId = getActiveVenueIdInternal();
  if (!activeId) return venues[0] ?? null;
  return venues.find((venue) => venue.id === activeId) ?? venues[0] ?? null;
}

export function getVenues(): VenueProfile[] {
  return getStoredVenues();
}

export function createVenue(payload: NewVenuePayload): VenueProfile | null {
  return createVenueInternal(payload);
}

export function updateVenue(id: string, updates: VenueUpdatePayload): VenueProfile | null {
  return updateVenueInternal(id, updates);
}

export function deleteVenue(id: string) {
  deleteVenueInternal(id);
}

export function setVenues(next: VenueProfile[]) {
  persistVenues(next);
}

export function getActiveVenueId(): string | null {
  return getActiveVenueIdInternal();
}

export function setActiveVenueId(id: string | null) {
  setActiveVenueIdInternal(id);
}

export function getActiveVenue(): VenueProfile | null {
  return getActiveVenueInternal();
}

export const storage = {
  getSetup(): WorkoutSetup | null {
    const stored = readScopedJSON<WorkoutSetup>(STORAGE_KEYS.setup);
    if (stored) return stored;
    writeScopedJSON(STORAGE_KEYS.setup, DEFAULT_SETUP);
    return DEFAULT_SETUP;
  },
  saveSetup(setup: WorkoutSetup) {
    writeScopedJSON(STORAGE_KEYS.setup, setup);
  },
  getPlan(): WorkoutPlan | null {
    const storedPlan = readScopedJSON<WorkoutPlan>(STORAGE_KEYS.plan);
    if (storedPlan?.exercises?.length) {
      return storedPlan;
    }
    const stations = readScopedJSON<WorkoutSetup>(STORAGE_KEYS.setup)?.stations ?? DEFAULT_SETUP.stations;
    const fallbackPlan = buildFallbackPlan(stations);
    writeScopedJSON(STORAGE_KEYS.plan, fallbackPlan);
    return fallbackPlan;
  },
  savePlan(plan: WorkoutPlan) {
    writeScopedJSON(STORAGE_KEYS.plan, plan);
  },
  getSession(): SessionState | null {
    return readScopedJSON<SessionState>(STORAGE_KEYS.session);
  },
  saveSession(session: SessionState) {
    writeScopedJSON(STORAGE_KEYS.session, session);
  },
  clearSession() {
    removeScopedValue(STORAGE_KEYS.session);
  },
  startSession(setup: WorkoutSetup) {
    const initialState: SessionState = {
      stationId: 1,
      round: 1,
      phase: "prep",
      remaining: 10, // 10 seconds prep time
      updatedAt: Date.now(),
    };
    this.saveSession(initialState);
  },
  subscribe(key: string, callback: (value: any) => void) {
    if (typeof window === "undefined") return;
    let scopedKey = getScopedStorageKey(key);
    const handler = (event: StorageEvent) => {
      if (event.key === scopedKey) {
        try {
          callback(event.newValue ? JSON.parse(event.newValue) : null);
        } catch (error) {
          console.error(`Failed to parse storage event for ${key}`, error);
        }
      }
    };
    const handleVenueUpdate = () => {
      scopedKey = getScopedStorageKey(key);
      try {
        callback(readJSONKey(scopedKey));
      } catch (error) {
        console.error(`Failed to broadcast venue change for ${key}`, error);
      }
    };
    window.addEventListener("storage", handler);
    window.addEventListener(VENUES_UPDATED_EVENT, handleVenueUpdate);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(VENUES_UPDATED_EVENT, handleVenueUpdate);
    };
  },
  getVenues,
  createVenue,
  updateVenue,
  deleteVenue,
  setVenues,
  getActiveVenueId,
  setActiveVenueId,
  getActiveVenue,
};

export function buildStationList(
  count: number,
  existing: StationSetup[] | undefined,
  defaultEquipment: EquipmentOption = "dumbbells"
): StationSetup[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const found = existing?.find((station) => station.id === id);
    return {
      id,
      equipment: found?.equipment ?? existing?.[index]?.equipment ?? defaultEquipment,
    };
  });
}

const THEME_COLOR_MAP: Record<string, BrandPalette> = {
  gold: {
    primary: "#FFD100",
    secondary: "#00BFFF",
    accent: "#FFFFFF",
  },
  neon: {
    primary: "#FF6BFF",
    secondary: "#2CDBFF",
    accent: "#FFFFFF",
  },
  "luxury-dark": {
    primary: "#F4D03F",
    secondary: "#76D7C4",
    accent: "#FDFEFE",
  },
};

export function getDefaultBrandColors(theme: string | undefined): BrandPalette {
  if (!theme) return THEME_COLOR_MAP.gold;
  return THEME_COLOR_MAP[theme] ?? THEME_COLOR_MAP.gold;
}

// ✅ Updated to pull from your new real dataset
export function getExercisesForEquipment(equipment: EquipmentOption): ExerciseMedia[] {
  return EXERCISE_LIBRARY.filter(
    (exercise: ExerciseMedia) =>
      exercise.equipment.toLowerCase() === equipment.toLowerCase()
  );
}
