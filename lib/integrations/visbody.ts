"use client";

export type BodyScanSummary = {
  id: string;
  memberName: string;
  bodyFat: number;
  muscleMass: number;
  postureScore: number;
  scannedAt: string;
};

import { supabase } from "@/lib/supabase";

export async function fetchLatestBodyScan(venueId: string | null) {
  const { data, error } = await supabase
    .from("body_scans")
    .select("*")
    .eq("venue_id", venueId ?? "master")
    .order("scanned_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.warn("Error fetching latest body scan:", error);
    return null;
  }

  return data ? {
    id: data.id,
    memberName: data.member_name,
    bodyFat: Number(data.body_fat),
    muscleMass: Number(data.muscle_mass),
    postureScore: data.posture_score,
    scannedAt: data.scanned_at,
  } : null;
}

export async function listBodyScans(venueId: string | null) {
  const { data, error } = await supabase
    .from("body_scans")
    .select("*")
    .eq("venue_id", venueId ?? "master")
    .order("scanned_at", { ascending: false });

  if (error) {
    console.warn("Error listing body scans:", error);
    return [];
  }

  return (data ?? []).map((scan) => ({
    id: scan.id,
    memberName: scan.member_name,
    bodyFat: Number(scan.body_fat),
    muscleMass: Number(scan.muscle_mass),
    postureScore: scan.posture_score,
    scannedAt: scan.scanned_at,
  }));
}
