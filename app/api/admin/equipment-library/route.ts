import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

import { fetchLibraryRows } from "@/lib/adminSupabase"

const EQUIPMENT_SELECTION = [
  "id",
  "equipment_name",
  "category",
  "image_url",
  "created_at",
].join(", ")

export async function GET() {
  try {
    const data = await fetchLibraryRows("equipment_library", EQUIPMENT_SELECTION)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error fetching equipment library:", error)
    const message =
      error instanceof Error ? error.message : "Unable to load equipment library"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    
    const { getServerSupabaseClient } = await import("@/lib/supabaseClient")
    const client = getServerSupabaseClient()

    if (id) {
       const { data: updated, error } = await client
        .from("equipment_library")
        .update(data as any)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return NextResponse.json(updated)
    } else {
       const { data: created, error } = await client
        .from("equipment_library")
        .insert(data as any)
        .select()
        .single()
      if (error) throw error
      return NextResponse.json(created)
    }
  } catch (error) {
    console.error("Error saving equipment:", error)
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
      .from("equipment_library")
      .delete()
      .eq("id", id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting equipment:", error)
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
