import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, hotel_id, qr_slug")
    .order("name", { ascending: true });

  if (error) {
    console.error("[rooms][GET]", error);
    return NextResponse.json({ error: "Failed to load rooms" }, { status: 500 });
  }

  return NextResponse.json({ rooms: data ?? [] });
}
