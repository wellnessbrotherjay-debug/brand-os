import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "edge";

/**
 * POST /api/programs/auto-push
 * Finds the program_day with today's scheduled_date and upserts it
 * to workouts id="active" so all displays update via Supabase Realtime.
 *
 * Can also be called with a specific { programId, dayNumber } to manually
 * push any day to the displays.
 */
export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json().catch(() => ({}));

  let dayData: { data: unknown; workout_name: string } | null = null;

  if (body.programId && body.dayNumber) {
    // Manual push: specific day from specific program
    const { data, error } = await supabase
      .from("program_days")
      .select("data, workout_name")
      .eq("program_id", body.programId)
      .eq("day_number", body.dayNumber)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Day not found", detail: error?.message },
        { status: 404 }
      );
    }
    dayData = data;
  } else {
    // Auto-push: find today's scheduled workout across all active programs
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const { data, error } = await supabase
      .from("program_days")
      .select("data, workout_name, programs!inner(is_active)")
      .eq("scheduled_date", today)
      .eq("programs.is_active", true)
      .order("day_number", { ascending: true })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { message: "No workout scheduled for today", date: today },
        { status: 200 }
      );
    }
    dayData = data;
  }

  // Upsert to workouts table with id="active" — triggers Realtime on all displays
  const now = new Date().toISOString();
  const { error: upsertError } = await supabase
    .from("workouts")
    .upsert(
      [
        {
          id: "active",
          name: dayData.workout_name || "Today's Workout",
          data: dayData.data,
          updated_at: now,
          is_template: false,
        },
      ],
      { onConflict: "id" }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    pushed: dayData.workout_name,
    at: now,
  });
}

/**
 * GET /api/programs/auto-push
 * Returns what's currently scheduled for today (preview before pushing).
 */
export async function GET() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("program_days")
    .select(
      "day_number, workout_name, scheduled_date, goal, programs!inner(id, name, is_active)"
    )
    .eq("scheduled_date", today)
    .eq("programs.is_active", true)
    .order("day_number", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ scheduled: null, date: today });
  }

  return NextResponse.json({ scheduled: data, date: today });
}
