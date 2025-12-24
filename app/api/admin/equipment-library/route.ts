import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

import { fetchLibraryRows } from "@/lib/adminSupabase"

const EQUIPMENT_SELECTION = [
  "id",
  "equipment_name",
  "category",
  "size_length",
  "size_width",
  "size_height",
  "weight",
  "required_space",
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
