"use client";

export type TdeeRequest = {
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: "sedentary" | "light" | "moderate" | "high";
  goal: "fat-loss" | "recomposition" | "performance";
};

export type TdeeResult = {
  bmr: number;
  calories: number;
};

const ACTIVITY_MULTIPLIER: Record<TdeeRequest["activityLevel"], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
};

export function calculateTDEE(input: TdeeRequest): TdeeResult {
  const { age, heightCm, weightKg, activityLevel } = input;
  const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  const calories = Math.round(bmr * ACTIVITY_MULTIPLIER[activityLevel]);
  return { bmr, calories };
}

export function estimateNutritionTargets(result: TdeeResult, goal: TdeeRequest["goal"]) {
  const macroMap = {
    "fat-loss": { protein: 1.1, carbs: 1.5, fats: 0.7 },
    recomposition: { protein: 1, carbs: 1.8, fats: 0.8 },
    performance: { protein: 0.9, carbs: 2.2, fats: 0.9 },
  } as const;

  const profile = macroMap[goal];
  return [
    { label: "Protein", value: `${Math.round(profile.protein * result.calories / 10)} g` },
    { label: "Carbohydrates", value: `${Math.round(profile.carbs * result.calories / 10)} g` },
    { label: "Fats", value: `${Math.round(profile.fats * result.calories / 10)} g` },
  ];
}
import { supabase } from "@/lib/supabase";

export async function fetchLatestTdeeLog(venueId: string | null, memberId: string) {
  const { data, error } = await supabase
    .from("tdee_logs")
    .select("*")
    .eq("venue_id", venueId ?? "master")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.warn("Error fetching latest TDEE log:", error);
    return null;
  }

  return data ? {
    id: data.id,
    inputs: data.inputs,
    result: data.result,
    createdAt: data.created_at,
  } : null;
}

export async function listTdeeLogs(venueId: string | null, memberId: string) {
  const { data, error } = await supabase
    .from("tdee_logs")
    .select("*")
    .eq("venue_id", venueId ?? "master")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Error listing TDEE logs:", error);
    return [];
  }

  return (data ?? []).map((log) => ({
    id: log.id,
    inputs: log.inputs,
    result: log.result,
    createdAt: log.created_at,
  }));
}
