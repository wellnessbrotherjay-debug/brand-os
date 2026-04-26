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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    
    // Lazy import supabase client
    const { getServerSupabaseClient } = await import("@/lib/supabaseClient")
    const client = getServerSupabaseClient()

    if (id) {
      // Update
      const { data: updated, error } = await client
        .from("exercise_library")
        .update(data as any)
        .eq("id", id)
        .select()
        .single()
      
      if (error) throw error
      return NextResponse.json(updated)
    } else {
      // Create
      const { data: created, error } = await client
        .from("exercise_library")
        .insert(data as any)
        .select()
        .single()
      
      if (error) throw error
      return NextResponse.json(created)
    }
  } catch (error) {
    console.error("Error saving exercise:", error)
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 })

    const { getServerSupabaseClient } = await import("@/lib/supabaseClient")
    const client = getServerSupabaseClient()

    const { error } = await client
      .from("exercise_library")
      .delete()
      .eq("id", id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting exercise:", error)
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
