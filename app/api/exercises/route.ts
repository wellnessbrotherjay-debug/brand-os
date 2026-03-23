import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "edge";

/**
 * GET /api/exercises
 * Returns all exercises from the Supabase `exercises` table that have a
 * Cloudflare Stream video ID (32-char hex) or full Cloudflare Stream URL.
 *
 * Query params:
 *   ?all=true   — return all exercises including those without video
 *   ?q=search   — filter by name (case-insensitive)
 *   ?type=      — filter by exercise type (strength|mobility|yoga|pilates|conditioning)
 *   ?tag=       — filter by tag
 *   ?bodyPart=  — filter by body_part column (if populated)
 *   ?movement=  — filter by movement_type column (if populated)
 *   ?equipment= — filter by equipment column (if populated)
 */
export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);

  const showAll = searchParams.get("all") === "true";
  const search = searchParams.get("q");
  const filterType = searchParams.get("type");
  const filterTag = searchParams.get("tag");
  const filterBodyPart = searchParams.get("bodyPart");
  const filterMovement = searchParams.get("movement");
  const filterEquipment = searchParams.get("equipment");

  let query = supabase
    .from("exercises")
    .select("id, slug, name, type, tags, demo_url, cues, body_part, movement_type, equipment")
    .order("name", { ascending: true });

  if (!showAll) {
    // Only return exercises with a Cloudflare Stream video
    query = query.not("demo_url", "is", null);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (filterType) {
    query = query.eq("type", filterType);
  }
  if (filterTag) {
    query = query.contains("tags", [filterTag]);
  }
  if (filterBodyPart) {
    query = query.eq("body_part", filterBodyPart);
  }
  if (filterMovement) {
    query = query.eq("movement_type", filterMovement);
  }
  if (filterEquipment) {
    query = query.eq("equipment", filterEquipment);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter client-side to only Cloudflare Stream IDs (32-char hex or cloudflarestream.com URL)
  // unless ?all=true is set
  const exercises = showAll
    ? (data ?? [])
    : (data ?? []).filter((ex) => {
        if (!ex.demo_url) return false;
        const isStreamId = ex.demo_url.length === 32 && !ex.demo_url.includes("/");
        const isStreamUrl = ex.demo_url.includes("cloudflarestream.com");
        return isStreamId || isStreamUrl;
      });

  return NextResponse.json(exercises);
}
