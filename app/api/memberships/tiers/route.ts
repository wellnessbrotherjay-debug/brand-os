

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const venueId = request.nextUrl.searchParams.get("venue");
    const supabase = createAdminClient();

    const query = supabase
      .from("membership_tiers")
      .select("*")
      .eq("active", true)
      .order("price_cents", { ascending: true })
      .limit(20);

    const { data, error } = venueId ? await query.eq("venue_id", venueId) : await query;

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Unable to load membership tiers" }, { status: 500 });
    }

    return NextResponse.json({ tiers: data ?? [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
