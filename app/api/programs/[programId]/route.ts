import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "edge";

type Ctx = { params: Promise<{ programId: string }> };

// GET /api/programs/[programId]
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { programId } = await ctx.params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("programs")
    .select(`*, program_days(*)`)
    .eq("id", programId)
    .order("day_number", { referencedTable: "program_days", ascending: true })
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH /api/programs/[programId] — update program meta or a specific day's workout
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { programId } = await ctx.params;
  const supabase = createAdminClient();
  const body = await req.json();

  // If patching a specific day
  if (body.day_number !== undefined) {
    const { day_number, workout_name, goal, studio_mode, data, scheduled_date } = body;
    const { error } = await supabase
      .from("program_days")
      .update({ workout_name, goal, studio_mode, data, scheduled_date })
      .eq("program_id", programId)
      .eq("day_number", day_number);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Otherwise patch program meta
  const { name, description, is_active } = body;
  const { error } = await supabase
    .from("programs")
    .update({ name, description, is_active })
    .eq("id", programId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/programs/[programId]
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { programId } = await ctx.params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("programs").delete().eq("id", programId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
