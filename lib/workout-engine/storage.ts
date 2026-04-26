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
  locked?: boolean; // AI: If true, don't rotate exercise
  allowedEquipment?: EquipmentOption[]; // AI: Allowed equipment for this station if variable
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
  mode: 'studio-a' | 'studio-b';
  exercisesPerStation?: number;
}

export const DEFAULT_STATIONS: StationSetup[] = Array.from({ length: 6 }, (_, index) => ({
  id: index + 1,
  equipment: "bodyweight",
}));

export const DEFAULT_SETUP: WorkoutSetup = {
  facilityName: "AVRL",
  stations: DEFAULT_STATIONS,
  logo: "/logos/global-avrl-logo.png", // New global logo path
  theme: "avrl",
  workTime: 45,
  restTime: 15,
  rounds: 1,
  colors: {
    primary: "#121112", // Matte Black
    secondary: "#C8A871", // Gold
    accent: "#F1EDE5", // Cream
  },
  mode: 'studio-a',
  exercisesPerStation: 1,
};

export interface StationExercise {
  stationId: number;
  name: string;
  video?: string | null;
  equipment?: string | null;
  muscles?: string[];
  cues?: string[];
  part?: number; // For Studio B: index of exercise at this station (0 or 1)
}

export interface WorkoutPlan {
  name?: string;
  goal: "Fat Loss" | "Strength" | "Endurance";
  exercises: StationExercise[];
  warmup?: StationExercise[];
  warmupDuration?: number; // Total minutes for warmup (e.g., 6)
  warmupMoveDuration?: number; // Seconds per move (e.g., 60)
  studioMode?: 'studio-a' | 'studio-b';
  scheduledDate?: string;
  isAiGenerated?: boolean;
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

export type SessionPhase = "prep" | "work" | "rest" | "change" | "complete";

export interface SessionState {
  stationId: number;
  round: number;
  setNumber: number; // For Studio A: 1-4 sets per station
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
  activeStudioId: "activeStudioId",
} as const;

function buildFallbackPlan(stations: StationSetup[] = DEFAULT_SETUP.stations): WorkoutPlan {
  const activeStudio = getActiveStudioIdInternal();
  const safeStations = stations.length ? stations : DEFAULT_STATIONS;
  const exercises: StationExercise[] = [];
  
  const setup = readScopedJSON<WorkoutSetup>(STORAGE_KEYS.setup);
  const exerciseCount = setup?.exercisesPerStation ?? (activeStudio === 'studio-b' ? 2 : 1);

  safeStations.forEach((station, index) => {
    for (let i = 0; i < exerciseCount; i++) {
      const exerciseIndex = (index * exerciseCount + i) % EXERCISE_LIBRARY.length;
      const exercise = EXERCISE_LIBRARY[exerciseIndex];
      exercises.push({
        stationId: station.id,
        name: exercise.name,
        video: exercise.video,
        equipment: exercise.equipment,
        muscles: exercise.muscles,
        cues: exercise.cues,
        part: i,
      });
    }
  });

  return {
    goal: "Fat Loss",
    exercises,
    studioMode: activeStudio as 'studio-a' | 'studio-b',
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

function getScopedStorageKey(
  baseKey: string,
  venueId: string | null = getActiveVenueIdInternal(),
  studioId: string | null = getActiveStudioIdInternal()
) {
  let key = baseKey;
  if (venueId) key += `::${venueId}`;
  if (studioId) key += `::${studioId}`;
  return key;
}

function readScopedJSON<T>(baseKey: string): T | null {
  const activeVenue = getActiveVenueIdInternal();
  const activeStudio = getActiveStudioIdInternal();
  const scopedKey = getScopedStorageKey(baseKey, activeVenue, activeStudio);
  const scopedValue = readJSONKey<T>(scopedKey);
  if (scopedValue !== null) return scopedValue;

  // Fallback 1: Venue-only namespace (migration from before studio namespacing)
  if (activeStudio) {
    const venueOnlyKey = getScopedStorageKey(baseKey, activeVenue, null);
    const venueOnlyValue = readJSONKey<T>(venueOnlyKey);
    if (venueOnlyValue !== null) {
      writeJSONKey(scopedKey, venueOnlyValue);
      return venueOnlyValue;
    }
  }

  // Fallback 2: Global namespace (original legacy)
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

function getActiveStudioIdInternal(): string | null {
  return readValue(STORAGE_KEYS.activeStudioId) || 'studio-a';
}

function setActiveStudioIdInternal(id: string | null) {
  writeValue(STORAGE_KEYS.activeStudioId, id);
  emitVenueUpdate(); // Re-use venue update event to trigger broad refreshes
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

export function getActiveStudioId(): string {
  return getActiveStudioIdInternal() || 'studio-a';
}

export function setActiveStudioId(id: string) {
  setActiveStudioIdInternal(id);
}

export const storage = {
  getSetup(): WorkoutSetup | null {
    const stored = readScopedJSON<WorkoutSetup>(STORAGE_KEYS.setup);
    if (stored) return stored;
    
    // Create a mode-appropriate default setup
    const activeStudio = getActiveStudioIdInternal() as 'studio-a' | 'studio-b';
    const defaultForMode: WorkoutSetup = {
      ...DEFAULT_SETUP,
      mode: activeStudio || 'studio-a',
      exercisesPerStation: activeStudio === 'studio-b' ? 2 : 1
    };
    
    writeScopedJSON(STORAGE_KEYS.setup, defaultForMode);
    return defaultForMode;
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
      setNumber: 1,
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
  getActiveStudioId,
  setActiveStudioId,
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
  avrl: {
    primary: "#121112", // Matte Black
    secondary: "#C8A871", // Gold
    accent: "#F1EDE5", // Cream
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
