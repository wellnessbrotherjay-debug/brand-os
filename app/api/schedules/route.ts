import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "edge";

// GET /api/schedules?day=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const day = searchParams.get("day");

  if (!day) return NextResponse.json({ error: "Missing day parameter" }, { status: 400 });

  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("scheduled_day", day)
    .order("start_time", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/schedules
// body: { program_id, studio_id, scheduled_day, start_time, workout_name }
export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();

  const { error } = await supabase.from("schedules").insert([body]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/schedules/:id handled by specific route or here
export async function DELETE(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
