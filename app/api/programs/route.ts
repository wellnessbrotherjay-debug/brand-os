import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "edge";

// GET /api/programs — list all programs
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("programs")
    .select(`*, program_days(*)`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/programs — create a new program with 10 empty day slots
export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();
  const { name = "Untitled Program", description = "", venue_id } = body;

  // Create the program
  const { data: program, error: progErr } = await supabase
    .from("programs")
    .insert({ name, description, venue_id })
    .select()
    .single();

  if (progErr) return NextResponse.json({ error: progErr.message }, { status: 500 });

  // Create empty day slots
  const dayCount = body.dayCount || 10;
  const days = Array.from({ length: dayCount }, (_, i) => ({
    program_id: program.id,
    day_number: i + 1,
    workout_name: `Day ${i + 1}`,
    goal: "Fat Loss",
    studio_mode: "studio-a",
    data: { 
      exercises: [], 
      warmup: [], 
      warmupDuration: 6,
      warmupRounds: 1,
      warmupWorkTime: 60,
      warmupRestTime: 0,
      goal: "Fat Loss", 
      studioMode: "studio-a" 
    },
  }));

  const { error: daysErr } = await supabase.from("program_days").insert(days);
  if (daysErr) return NextResponse.json({ error: daysErr.message }, { status: 500 });

  // Return full program with days
  const { data: full } = await supabase
    .from("programs")
    .select(`*, program_days(*)`)
    .eq("id", program.id)
    .single();

  return NextResponse.json(full, { status: 201 });
}
