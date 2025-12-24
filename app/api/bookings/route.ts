import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { CreateBookingSchema } from "@/lib/types/hotel-fitness";

const DATE_ERROR =
  "Check-in must be before check-out and both must be valid dates.";

const toDate = (value: string) => new Date(value);

const rangesOverlap = (
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
) => startA < endB && startB < endA;

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId query param required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, status, check_in, check_out, package_name, guest_name, created_at, updated_at, room:rooms ( id, name )")
    .eq("user_id", userId)
    .order("check_in", { ascending: true });

  if (error) {
    console.error("[bookings][GET]", error);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }

  return NextResponse.json({ bookings: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const checkIn = toDate(payload.checkIn);
  const checkOut = toDate(payload.checkOut);

  if (!(checkIn instanceof Date) || !(checkOut instanceof Date) || Number.isNaN(checkIn.valueOf()) || Number.isNaN(checkOut.valueOf()) || checkOut <= checkIn) {
    return NextResponse.json({ error: DATE_ERROR }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("id", payload.roomId)
    .maybeSingle();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const { data: existing, error: overlapError } = await supabase
    .from("bookings")
    .select("check_in, check_out, status")
    .eq("room_id", payload.roomId)
    .neq("status", "canceled");

  if (overlapError) {
    console.error("[bookings][POST] overlap check", overlapError);
    return NextResponse.json({ error: "Unable to verify availability" }, { status: 500 });
  }

  const conflict = (existing ?? []).some((booking) =>
    rangesOverlap(
      toDate(booking.check_in),
      toDate(booking.check_out),
      checkIn,
      checkOut
    )
  );

  if (conflict) {
    return NextResponse.json({ error: "Selected room is not available" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: payload.userId,
      room_id: payload.roomId,
      check_in: payload.checkIn,
      check_out: payload.checkOut,
      guest_name: payload.guestName,
      guest_email: payload.guestEmail,
      guest_phone: payload.guestPhone,
      package_name: payload.packageName,
      party_size: payload.partySize,
      special_requests: payload.specialRequests,
      source: payload.source ?? "mobile",
      status: "confirmed",
    })
    .select("id, status, check_in, check_out, package_name, guest_name, room:rooms ( id, name )")
    .single();

  if (error) {
    console.error("[bookings][POST] insert", error);
    return NextResponse.json({ error: "Unable to create booking" }, { status: 500 });
  }

  return NextResponse.json({ booking: data });
}
