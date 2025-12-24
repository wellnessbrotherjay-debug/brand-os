import { NextResponse } from "next/server"
import { fetchLibraryRows } from "@/lib/adminSupabase"

const EXERCISE_SELECTION = [
  "id",
  "exercise_name",
  "primary_muscle_group",
  "required_equipment",
  "difficulty_level",
  "intensity",
  "training_type",
  "video_url",
  "thumbnail_url",
  "created_at",
].join(", ")

export async function GET() {
  try {
    const data = await fetchLibraryRows("exercise_library", EXERCISE_SELECTION)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error fetching exercise library:", error)
    const message =
      error instanceof Error ? error.message : "Unable to load exercise library"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
