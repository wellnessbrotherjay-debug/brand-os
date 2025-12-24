"use client";

export interface BrandTheme {
  name: string;
  logoUrl: string;
  backgroundUrl: string;
  videoUrl?: string | null;
  primary: string;
  secondary: string;
  accent: string;
  font: string;
}

export const BRAND_SLUG = process.env.NEXT_PUBLIC_BRAND_SLUG ?? "default";
export const BRAND_CACHE_KEY = "hotel_fit_brand_theme";

export const DEFAULT_WELCOME_VIDEO_URL =
  "https://watch.cloudflarestream.com/jPokBIILUKYwWLcJwmuCV_bvQgKJfdnqqivRGJi5";

export const defaultTheme: BrandTheme = {
  name: "GLVT by TS Suites",
  logoUrl: "/assets/logo.png",
  backgroundUrl: "/assets/hotel-bg.jpg",
  videoUrl: DEFAULT_WELCOME_VIDEO_URL,
  primary: "#00CFFF",
  secondary: "#1AE6B5",
  accent: "#FFB400",
  font: "Inter, sans-serif",
};
