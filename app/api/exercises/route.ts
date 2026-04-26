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

  // Filter client-side to only meaningful video sources
  // (32-char hex, Cloudflare URLs, or valid local paths)
  const filtered = (data ?? []).filter((ex) => {
    if (!ex.demo_url) return false;
    const url = ex.demo_url.trim();
    if (url === "" || url.toLowerCase() === "todo") return false;

    // Is it a Cloudflare Stream ID (32 chars hex)?
    const isId = /^[a-f0-9]{32}$/i.test(url);
    // Is it a local path or a remote URL?
    const isPath = url.startsWith("/") || url.startsWith("http");
    
    return isId || isPath;
  });

  return NextResponse.json(filtered);
}
