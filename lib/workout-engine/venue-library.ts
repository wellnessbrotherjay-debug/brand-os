"use client";

import { supabase } from "@/lib/supabase";
import {
  getActiveVenueId,
  VENUES_UPDATED_EVENT,
} from "@/lib/workout-engine/storage";

export type LibraryType = "exercise" | "machine" | "video";

export interface VenueLibraryRecord {
  id: string;
  slug: string;
  name: string;
  venue_id: string | null;
  video_url?: string | null;
  media_url?: string | null;
  equipment?: string | null;
  instructions?: string | null;
  metadata?: Record<string, any> | null;
  [key: string]: any;
}

interface LoadLibraryOptions {
  bypassCache?: boolean;
  venueId?: string | null;
}

interface SaveRecordOptions {
  venueId?: string | null;
}

const TABLE_MAP: Record<LibraryType, string> = {
  exercise: "exercise_library",
  machine: "machine_library",
  video: "video_library",
};

const CACHE_PREFIX = "venueLibraryCache";
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

type CachedLibrary = {
  timestamp: number;
  items: VenueLibraryRecord[];
};

function buildCacheKey(type: LibraryType, venueId?: string | null) {
  const active = venueId ?? getActiveVenueId() ?? "master";
  return `${CACHE_PREFIX}::${type}::${active}`;
}

function readCache(type: LibraryType, venueId?: string | null): VenueLibraryRecord[] | null {
  if (typeof window === "undefined") return null;
  const key = buildCacheKey(type, venueId);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedLibrary;
    if (Date.now() - parsed.timestamp > CACHE_TTL) return null;
    return parsed.items;
  } catch (error) {
    console.warn("Failed to parse venue library cache", error);
    return null;
  }
}

function writeCache(type: LibraryType, venueId: string | null, items: VenueLibraryRecord[]) {
  if (typeof window === "undefined") return;
  const key = buildCacheKey(type, venueId);
  const payload: CachedLibrary = {
    timestamp: Date.now(),
    items,
  };
  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Best effort cache
  }
}

function clearCache(type?: LibraryType, venueId?: string | null) {
  if (typeof window === "undefined") return;
  if (!type) {
    Object.keys(TABLE_MAP).forEach((entry) => clearCache(entry as LibraryType, venueId));
    return;
  }
  const key = buildCacheKey(type, venueId);
  window.localStorage.removeItem(key);
}

export function mergeLibraries(master: VenueLibraryRecord[], custom: VenueLibraryRecord[]) {
  const overrideMap = new Map<string, VenueLibraryRecord>();
  for (const item of custom) {
    overrideMap.set(item.slug, item);
  }
  const merged = [
    ...custom,
    ...master.filter((item) => !overrideMap.has(item.slug)),
  ];
  return merged.sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchLibraryRows(type: LibraryType, venueId?: string | null) {
  const table = TABLE_MAP[type];
  const targetVenue = venueId ?? getActiveVenueId() ?? null;

  const [masterResult, venueResult] = await Promise.all([
    supabase.from(table).select("*").is("venue_id", null),
    supabase.from(table).select("*").eq("venue_id", targetVenue),
  ]);

  if (masterResult.error) throw masterResult.error;
  if (venueResult.error) throw venueResult.error;

  return mergeLibraries(masterResult.data ?? [], venueResult.data ?? []);
}

export async function loadVenueLibrary(type: LibraryType, options: LoadLibraryOptions = {}) {
  const venueId = options.venueId ?? getActiveVenueId() ?? null;

  if (!options.bypassCache) {
    const cached = readCache(type, venueId);
    if (cached) return cached;
  }

  const merged = await fetchLibraryRows(type, venueId);
  writeCache(type, venueId, merged);
  return merged;
}

export async function saveVenueLibraryRecord(
  type: LibraryType,
  record: Omit<VenueLibraryRecord, "id" | "venue_id"> & { id?: string; venue_id?: string | null },
  options: SaveRecordOptions = {}
) {
  const table = TABLE_MAP[type];
  const venueId = options.venueId ?? record.venue_id ?? getActiveVenueId() ?? null;
  const payload = {
    ...record,
    venue_id: venueId,
  };

  const { data, error } = await supabase
    .from(table)
    .upsert(payload, { onConflict: "slug, venue_id" })
    .select()
    .single();

  if (error) throw error;
  clearCache(type, venueId);
  return data;
}

export async function deleteVenueLibraryRecord(
  type: LibraryType,
  slug: string,
  options: { venueId?: string | null } = {}
) {
  const table = TABLE_MAP[type];
  const venueId = options.venueId ?? getActiveVenueId() ?? null;
  if (!venueId) return;

  const { error } = await supabase
    .from(table)
    .delete()
    .eq("slug", slug)
    .eq("venue_id", venueId);

  if (error) throw error;
  clearCache(type, venueId);
}

if (typeof window !== "undefined") {
  window.addEventListener(VENUES_UPDATED_EVENT, () => {
    clearCache();
  });
}
