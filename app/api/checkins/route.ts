"use server";

import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  userId: z.string().uuid(),
  venueId: z.string().uuid(),
  source: z.enum(["qr", "kiosk", "staff"]).default("qr"),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = bodySchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { userId, venueId, source } = parsed.data;
    const supabase = createAdminClient();

    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("id,start_date,end_date,status")
      .eq("user_id", userId)
      .eq("venue_id", venueId)
      .eq("status", "active")
      .order("end_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error(membershipError);
      return NextResponse.json({ error: "Unable to validate membership" }, { status: 500 });
    }

    if (!membership) {
      return NextResponse.json({ error: "No active membership", code: "membership_required" }, { status: 402 });
    }

    const today = new Date().toISOString().slice(0, 10);
    if ((membership.start_date && membership.start_date > today) || (membership.end_date && membership.end_date < today)) {
      return NextResponse.json({ error: "Membership expired", code: "membership_expired" }, { status: 402 });
    }

    const { error: insertError } = await supabase.from("check_ins").insert({
      user_id: userId,
      venue_id: venueId,
      source,
    });

    if (insertError) {
      console.error(insertError);
      return NextResponse.json({ error: "Unable to record check-in" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
