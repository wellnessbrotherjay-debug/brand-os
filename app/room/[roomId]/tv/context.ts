import { addHours, differenceInCalendarDays } from "date-fns";
import { createAdminClient } from "@/lib/supabase/server";

export type RoomRow = { id: string; name: string | null };
type SessionRow = { user_id: string | null; started_at: string | null };
type EventRow = {
  id: string;
  title: string | null;
  starts_at: string | null;
  description: string | null;
  cover_url: string | null;
};
type MenuItemRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  tags: string[] | null;
};
type MealOrderRow = { guest_name: string | null };
type BookingRow = {
  guest_name: string | null;
  check_in: string;
  check_out: string;
  package_name: string | null;
  status: string | null;
};

export type EventCard = {
  id: string;
  title: string;
  subtitle: string;
  startsAt: string | null;
};

export type MenuHighlight = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
};

export type WelcomeContext = {
  roomName: string;
  guestName: string;
  booking: {
    checkIn: string;
    checkOut: string;
    nights: number;
    packageName: string;
  };
  events: EventCard[];
  menuHighlights: MenuHighlight[];
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const FALLBACK_EVENTS: EventCard[] = [
  {
    id: "sunrise",
    title: "Sunrise Rooftop Flow",
    subtitle: "Sky Deck · Limited mats",
    startsAt: addHours(new Date(), 2).toISOString(),
  },
  {
    id: "mixology",
    title: "Botanical Mixology Lab",
    subtitle: "Lobby Bar · 7:30 PM",
    startsAt: addHours(new Date(), 10).toISOString(),
  },
  {
    id: "soundbath",
    title: "Sound Bath + Breathwork",
    subtitle: "Wellness Studio · 9:00 PM",
    startsAt: addHours(new Date(), 12).toISOString(),
  },
];

const FALLBACK_MENU: MenuHighlight[] = [
  {
    id: "chef-bowl",
    name: "Chef's Reset Bowl",
    subtitle: "Charred salmon · ancient grains · citrus miso",
    price: currencyFormatter.format(32),
  },
  {
    id: "hydration",
    name: "Hydration Ritual Tray",
    subtitle: "Cold-pressed juices · herbal elixirs",
    price: currencyFormatter.format(24),
  },
  {
    id: "midnight",
    name: "Midnight Truffle Flight",
    subtitle: "72% cacao, pistachio brittle, sea salt honey",
    price: currencyFormatter.format(18),
  },
];

export async function getWelcomeContext(roomId: string): Promise<WelcomeContext> {
  const supabase = createAdminClient();

  const [roomResponse, sessionResponse, eventsResponse, menuResponse, bookingsResponse] =
    await Promise.all([
      supabase
        .from("rooms")
        .select("id, name")
        .eq("id", roomId)
        .maybeSingle(),
      supabase
        .from("workout_sessions")
        .select("user_id, started_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("events")
        .select("id, title, starts_at, description, cover_url")
        .eq("active", true)
        .order("starts_at", { ascending: true })
        .limit(3),
      supabase
        .from("menu_items")
        .select("id, name, description, price_cents, tags")
        .order("created_at", { ascending: true })
        .limit(3),
      supabase
        .from("bookings")
        .select("guest_name, check_in, check_out, package_name, status")
        .eq("room_id", roomId)
        .neq("status", "canceled")
        .order("check_in", { ascending: true }),
    ]);

  const room = (roomResponse.data as RoomRow | null) ?? null;
  const session = (sessionResponse.data as SessionRow | null) ?? null;
  const events = (eventsResponse.data as EventRow[] | null) ?? [];
  const menu = (menuResponse.data as MenuItemRow[] | null) ?? [];
  const bookings = (bookingsResponse.data as BookingRow[] | null) ?? [];

  let guestName = "Valued Guest";

  if (session?.user_id) {
    const profileResponse = await supabase
      .from("user_profiles")
      .select("first_name, last_name")
      .eq("user_id", session.user_id)
      .maybeSingle();

    if (!profileResponse.error && profileResponse.data) {
      const { first_name, last_name } = profileResponse.data as {
        first_name?: string | null;
        last_name?: string | null;
      };
      const resolved = [first_name, last_name]
        .filter((part) => Boolean(part?.trim()))
        .join(" ")
        .trim();
      if (resolved) {
        guestName = resolved;
      }
    }
  }

  if (guestName === "Valued Guest" && room?.name) {
    const mealResponse = await supabase
      .from("meal_orders")
      .select("guest_name")
      .eq("room_number", room.name)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!mealResponse.error && mealResponse.data) {
      const recent = mealResponse.data as MealOrderRow;
      if (recent.guest_name) {
        guestName = recent.guest_name;
      }
    }
  }

  const defaultNights = 2;
  let checkInDate = session?.started_at ? new Date(session.started_at) : new Date();
  let checkOutDate = new Date(checkInDate.getTime() + defaultNights * 24 * 60 * 60 * 1000);
  let packageName = "Mind & Body Retreat";

  const activeBooking = pickRelevantBooking(bookings);
  if (activeBooking) {
    const bookingCheckIn = new Date(activeBooking.check_in);
    const bookingCheckOut = new Date(activeBooking.check_out);
    if (!Number.isNaN(bookingCheckIn.valueOf())) {
      checkInDate = bookingCheckIn;
    }
    if (!Number.isNaN(bookingCheckOut.valueOf())) {
      checkOutDate = bookingCheckOut;
    }
    if (activeBooking.package_name) {
      packageName = activeBooking.package_name;
    }
    if (activeBooking.guest_name) {
      guestName = activeBooking.guest_name;
    }
  }

  const nights =
    differenceInCalendarDays(checkOutDate, checkInDate) > 0
      ? differenceInCalendarDays(checkOutDate, checkInDate)
      : defaultNights;

  const normalizedEvents: EventCard[] = events.length
    ? events.map((event) => ({
        id: event.id,
        title: event.title ?? "Signature Event",
        subtitle: event.description ?? "Curated by our concierge & wellness guides",
        startsAt: event.starts_at,
      }))
    : FALLBACK_EVENTS;

  const normalizedMenu: MenuHighlight[] = menu.length
    ? menu.map((item) => ({
        id: item.id,
        name: item.name,
        subtitle:
          item.description ??
          item.tags?.[0] ??
          "Seasonal spotlight from our culinary team",
        price: formatCurrency(item.price_cents ?? 0),
      }))
    : FALLBACK_MENU;

  return {
    roomName: room?.name ?? "Skyline Suite",
    guestName,
    booking: {
      checkIn: checkInDate.toISOString(),
      checkOut: checkOutDate.toISOString(),
      nights,
      packageName,
    },
    events: normalizedEvents,
    menuHighlights: normalizedMenu,
  };
}

function formatCurrency(cents: number) {
  return currencyFormatter.format(Math.max(0, cents) / 100);
}

function pickRelevantBooking(rows: BookingRow[]): BookingRow | null {
  if (!rows.length) return null;
  const now = new Date();
  const active = rows.find((row) => {
    const start = new Date(row.check_in);
    const end = new Date(row.check_out);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) return false;
    return start <= now && end >= now;
  });
  if (active) return active;
  return rows[0];
}
