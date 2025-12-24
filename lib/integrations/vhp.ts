"use client";

export type VhpMenuFeedItem = {
  id?: string | number;
  name: string;
  description?: string;
  price?: number | string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  category?: string;
  image_url?: string;
};

export async function fetchVhpMenuFeed(feedUrl?: string) {
  if (!feedUrl) return [] as VhpMenuFeedItem[];
  try {
    const response = await fetch(feedUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`VHP feed ${response.status}`);
    const json = await response.json();
    if (Array.isArray(json)) return json as VhpMenuFeedItem[];
    if (Array.isArray(json?.items)) return json.items as VhpMenuFeedItem[];
    return [];
  } catch (error) {
    console.warn("VHP menu feed error", error);
    return [];
  }
}
