"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAppConfig } from "@/lib/app-config";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type QuickWorkout = {
  id: string;
  title: string;
  duration: string;
  focus: string;
};

type ClassItem = {
  id: string;
  name: string;
  coach: string;
  time: string;
  spots: number;
};

type MenuItem = {
  id: string;
  name: string;
  macros: string;
  price: string;
  tag: string;
};

type EventItem = {
  id: string;
  title: string;
  when: string;
  summary: string;
};

type BookingSummary = {
  id: string;
  status: string;
  check_in: string;
  check_out: string;
  package_name?: string | null;
  guest_name?: string | null;
  room?: {
    id: string;
    name?: string | null;
  };
};

type MembershipTier = {
  id: string;
  name: string;
  price_cents: number;
  duration_days: number;
  description?: string | null;
};

const mockMembership = {
  tier: "Titanium",
  points: 1420,
  expiresAt: format(new Date().setMonth(new Date().getMonth() + 1), "MMM dd"),
  status: "Active",
};

const quickWorkouts: QuickWorkout[] = [
  { id: "rw-1", title: "Room Reset", duration: "12 min", focus: "Mobility" },
  { id: "rw-2", title: "Power Circuit", duration: "20 min", focus: "Strength" },
  { id: "rw-3", title: "Hotel HIIT", duration: "15 min", focus: "Cardio" },
];

const gymTemplates: QuickWorkout[] = [
  { id: "gt-1", title: "Athlete Build", duration: "45 min", focus: "Push/Pull" },
  { id: "gt-2", title: "Glute Lab", duration: "35 min", focus: "Lower Body" },
  { id: "gt-3", title: "Engine Day", duration: "30 min", focus: "Conditioning" },
];

const bodyScanTrends = [
  { label: "Weight", value: "178 lb", delta: "-2.4 lb" },
  { label: "Body Fat", value: "18.1%", delta: "-0.8%" },
  { label: "Muscle", value: "78.6 lb", delta: "+1.2 lb" },
];

const classSchedule: ClassItem[] = [
  { id: "cl-1", name: "Sunrise Circuit", coach: "Ava", time: "6:00 AM", spots: 4 },
  { id: "cl-2", name: "VisBody Scan", coach: "Lab 2", time: "8:30 AM", spots: 2 },
  { id: "cl-3", name: "Strength Lab", coach: "Mason", time: "5:30 PM", spots: 6 },
];

const menuHighlights: MenuItem[] = [
  { id: "mn-1", name: "Protein Bento", macros: "520 kcal • 42P", price: "$18", tag: "Muscle" },
  { id: "mn-2", name: "VisBody Cleanse", macros: "320 kcal • 35C", price: "$12", tag: "Recovery" },
  { id: "mn-3", name: "Circuit Fuel", macros: "640 kcal • 54C", price: "$20", tag: "Performance" },
];

const eventFeed: EventItem[] = [
  { id: "ev-1", title: "Sun Deck Flow", when: "Tomorrow • 7am", summary: "Vinyasa + breathwork" },
  { id: "ev-2", title: "Members Social", when: "Fri • 6pm", summary: "Cold plunge + mocktails" },
  { id: "ev-3", title: "Open Circuit Lab", when: "Sat • 10am", summary: "Coach-led HR session" },
];

const fallbackTiers: MembershipTier[] = [
  { id: "tier-1", name: "Day Pass", price_cents: 4500, duration_days: 1, description: "24h access + classes" },
  { id: "tier-2", name: "Elite Monthly", price_cents: 32000, duration_days: 30, description: "Unlimited gym + recovery" },
];

export default function MobilePage() {
  const config = useMemo(() => getAppConfig(), []);
  const [activeNav, setActiveNav] = useState<"dashboard" | "workouts" | "menu" | "events" | "profile">("dashboard");
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [magicLinkStatus, setMagicLinkStatus] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userId, setUserId] = useState("");
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadTiers = async () => {
      try {
        const response = await fetch("/api/memberships/tiers");
        const json = await response.json();
        if (!cancelled) {
          const remote = (json?.tiers ?? []) as MembershipTier[];
          setTiers(remote.length ? remote : fallbackTiers);
        }
      } catch (error) {
        console.warn("Failed to load membership tiers", error);
        if (!cancelled) {
          setTiers(fallbackTiers);
        }
      } finally {
        if (!cancelled) setTiersLoading(false);
      }
    };
    loadTiers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setAuthUser(data.session?.user ?? null);
      setUserId(data.session?.user?.id ?? "");
    };
    syncSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthUser(session?.user ?? null);
      setUserId(session?.user?.id ?? "");
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const requestMagicLink = async () => {
    if (!email) {
      setMagicLinkStatus("Enter an email first");
      return;
    }
    try {
      setMagicLinkStatus("Sending link…");
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const error = await response.json();
        setMagicLinkStatus(error?.error ?? "Failed to send link");
        return;
      }
      setMagicLinkStatus("Check your inbox for the link");
      setEmail("");
    } catch (error) {
      console.error(error);
      setMagicLinkStatus("Network error");
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "workouts", label: "Workouts" },
    { id: "menu", label: "Menu" },
    { id: "events", label: "Events" },
    { id: "profile", label: "Profile" },
  ];

  const sectionMap: Record<typeof navItems[number]["id"], string> = {
    dashboard: "mobile-dashboard",
    workouts: "mobile-workouts",
    menu: "mobile-menu",
    events: "mobile-events",
    profile: "mobile-profile",
  };

  const handleNav = (id: typeof navItems[number]["id"]) => {
    setActiveNav(id as typeof activeNav);
    const sectionId = sectionMap[id];
    if (sectionId && typeof window !== "undefined") {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  useEffect(() => {
    if (!userId) {
      setBookings([]);
      return;
    }
    const controller = new AbortController();
    const loadBookings = async () => {
      setBookingsLoading(true);
      setBookingError(null);
      try {
        const response = await fetch(`/api/bookings?userId=${userId}`, {
          signal: controller.signal,
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json?.error ?? "Failed to load bookings");
        }
        setBookings(json.bookings ?? []);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn("[mobile] bookings", error);
        setBookingError(error instanceof Error ? error.message : "Failed to load bookings");
      } finally {
        if (!controller.signal.aborted) {
          setBookingsLoading(false);
        }
      }
    };
    loadBookings();
    return () => controller.abort();
  }, [userId]);


  const isAuthenticated = Boolean(authUser);
  const bookingHref = "/mobile/book-room";
  const linkedAccountLabel = authUser?.email ?? authUser?.phone ?? authUser?.id ?? "Not signed in";

  const formatStayRange = (checkIn: string, checkOut: string) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (Number.isNaN(checkInDate.valueOf()) || Number.isNaN(checkOutDate.valueOf())) {
      return `${checkIn} → ${checkOut}`;
    }
    return `${format(checkInDate, "MMM d")} → ${format(checkOutDate, "MMM d")}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 pb-24 pt-6">
        <header id="mobile-dashboard" className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-800/60 p-5 shadow-[0_20px_45px_rgba(2,6,23,0.45)]">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
            {config.isHotel ? "HotelFit Mobile" : "Gym Control"}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Taylor Morgan</h1>
              <p className="text-sm text-slate-400">Room 1904 • Last scan 2d ago</p>
            </div>
            <div className="flex flex-col items-end text-right text-xs uppercase tracking-[0.35em] text-slate-400">
              <span>{mockMembership.tier}</span>
              <span className="text-emerald-300">Status • {mockMembership.status}</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-xl font-semibold text-white">{mockMembership.points}</div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Points</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-xl font-semibold text-white">72 bpm</div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">HR strap</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-xl font-semibold text-white">{mockMembership.expiresAt}</div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Renews</p>
            </div>
          </div>
        </header>

        <section className="space-y-4 rounded-3xl border border-white/5 bg-slate-900/50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Hotel access</p>
              <h2 className="text-lg font-semibold text-white">Link your stay</h2>
              <p className="text-sm text-slate-400">
                Sign in with the magic link below and every booking you place will sync to in-room TVs, tablets,
                workouts, and concierge dashboards automatically.
              </p>
            </div>
            {isAuthenticated ? (
              <Link
                href={bookingHref}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.4em] text-emerald-200 transition hover:bg-white/20"
              >
                Book room
              </Link>
            ) : (
              <button
                onClick={requestMagicLink}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.4em] text-emerald-200 transition hover:bg-white/20"
              >
                Get link
              </button>
            )}
          </div>
          {isAuthenticated ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Signed in as</p>
              <p className="text-white">{linkedAccountLabel}</p>
              <p className="text-xs text-slate-400">{authUser?.id}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              Tap <strong>Magic link</strong> in the memberships panel below to receive an email sign-in. Once you open
              the link on this device, the booking form will automatically know who you are.
            </div>
          )}
        </section>

        <section id="mobile-workouts" className="space-y-4 rounded-3xl border border-white/5 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-sky-300">Room bookings</p>
              <h2 className="text-lg font-semibold text-white">Upcoming stays</h2>
            </div>
            <span className="text-[10px] uppercase tracking-[0.35em] text-slate-400">
              {bookings.length} total
            </span>
          </div>
          {userId ? (
            bookingsLoading ? (
              <p className="text-sm text-slate-400">Loading bookings…</p>
            ) : bookingError ? (
              <p className="text-sm text-red-300">{bookingError}</p>
            ) : bookings.length ? (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-400">
                      <span>{booking.room?.name ?? "Room"}</span>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] ${
                          booking.status === "confirmed"
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-slate-700 text-slate-200"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-white">{formatStayRange(booking.check_in, booking.check_out)}</p>
                    {booking.package_name && (
                      <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">{booking.package_name}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                No bookings yet. Tap “Book room” to create a test stay for this profile.
              </p>
            )
          ) : (
            <p className="text-sm text-slate-400">
              Sign in with a magic link first to view your upcoming hotel stays.
            </p>
          )}
        </section>

        <section className="space-y-4 rounded-3xl border border-white/5 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-sky-300">Vitals</p>
              <h2 className="text-lg font-semibold text-white">Body Scan Trends</h2>
            </div>
            <button className="text-xs uppercase tracking-[0.4em] text-emerald-300">View</button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            {bodyScanTrends.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/5 bg-slate-900/70 p-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{metric.label}</p>
                <div className="mt-1 text-lg font-semibold">{metric.value}</div>
                <p className="text-xs text-emerald-300">{metric.delta}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/5 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-sky-300">Workouts</p>
              <h2 className="text-lg font-semibold">
                {config.isHotel ? "Room Workout Stack" : "Gym Templates"}
              </h2>
            </div>
            <button className="text-xs uppercase tracking-[0.4em] text-emerald-300">
              {config.isHotel ? "Start" : "Build"}
            </button>
          </div>
          <div className="space-y-3">
            {(config.isHotel ? quickWorkouts : gymTemplates).map((workout) => (
              <div
                key={workout.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{workout.title}</p>
                  <p className="text-xs text-slate-400">
                    {workout.duration} • {workout.focus}
                  </p>
                </div>
                <Link
                  href="/workouts"
                  className="rounded-full border border-sky-400/50 px-4 py-1 text-[11px] uppercase tracking-[0.3em] text-sky-200"
                >
                  Go
                </Link>
              </div>
            ))}
          </div>
          {config.features.circuitMode && (
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.35em] text-sky-300">Circuit mode</p>
              <p className="mt-1 text-white">Stations synced • 45s work / 15s rest • HR overlay on</p>
            </div>
          )}
        </section>

        <section className="space-y-3 rounded-3xl border border-white/5 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-sky-300">Classes & Bookings</p>
              <h2 className="text-lg font-semibold text-white">Today&apos;s roster</h2>
            </div>
            <Link href="/facilities" className="text-xs uppercase tracking-[0.4em] text-emerald-300">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {classSchedule.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/60 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{entry.name}</p>
                  <p className="text-xs text-slate-400">
                    {entry.time} • Coach {entry.coach}
                  </p>
                </div>
                <span className="text-xs text-emerald-300">{entry.spots} spots</span>
              </div>
            ))}
          </div>
        </section>

        {config.features.menuOrders && (
          <section id="mobile-menu" className="space-y-3 rounded-3xl border border-white/5 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-sky-300">Kitchen & Fuel</p>
                <h2 className="text-lg font-semibold text-white">Macros by goal</h2>
              </div>
              <Link href="/menu" className="text-xs uppercase tracking-[0.4em] text-emerald-300">
                Order
              </Link>
            </div>
            <div className="space-y-3">
              {menuHighlights.map((item) => (
                <Link
                  key={item.id}
                  href="/menu"
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/60 px-4 py-3 transition hover:bg-white/5"
                >
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.macros}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p className="font-semibold text-white">{item.price}</p>
                    <p>{item.tag}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section id="mobile-events" className="space-y-3 rounded-3xl border border-white/5 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-sky-300">Events</p>
              <h2 className="text-lg font-semibold text-white">Stay in the loop</h2>
            </div>
            <a href="mailto:concierge@hotelfit.com" className="text-xs uppercase tracking-[0.4em] text-emerald-300">
              Subscribe
            </a>
          </div>
          <div className="space-y-3">
            {eventFeed.map((event) => (
              <article key={event.id} className="rounded-2xl border border-white/5 bg-slate-950/60 px-4 py-3">
                <p className="text-sm font-semibold">{event.title}</p>
                <p className="text-xs text-slate-400">{event.when}</p>
                <p className="mt-1 text-xs text-slate-300">{event.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="mobile-profile" className="space-y-4 rounded-3xl border border-white/5 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-sky-300">Memberships</p>
              <h2 className="text-lg font-semibold text-white">Upgrade or renew</h2>
            </div>
            <button className="text-xs uppercase tracking-[0.4em] text-emerald-300" onClick={requestMagicLink}>
              Magic link
            </button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="you@email.com"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm"
            />
            {magicLinkStatus && <p className="mt-2 text-xs text-emerald-300">{magicLinkStatus}</p>}
          </div>
          <div className="space-y-3">
            {tiersLoading ? (
              <p className="text-sm text-slate-400">Loading tiers…</p>
            ) : (
              tiers.map((tier) => (
                <div key={tier.id} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                  <p className="text-sm font-semibold">{tier.name}</p>
                  <p className="text-xs text-slate-400">{tier.description}</p>
                  <p className="mt-1 text-sm text-white">
                    ${((tier.price_cents ?? 0) / 100).toFixed(2)} • {tier.duration_days ?? 0} days
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {config.features.pos && (
          <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950 p-5 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.35em] text-pink-300">POS + Staff tools</p>
            <p className="mt-2 text-white">
              Sell passes, renew memberships, and email receipts directly from mobile. Tap to launch the staff console.
            </p>
            <Link href="/staff" className="mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/80">
              Open staff console
            </Link>
          </section>
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 mx-auto flex max-w-xl items-center justify-between border-t border-white/10 bg-slate-950/90 px-2 py-3 text-xs uppercase tracking-[0.3em]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id as typeof activeNav)}
            className={`flex-1 rounded-full px-3 py-2 ${
              activeNav === item.id ? "bg-sky-500/20 text-sky-100" : "text-slate-500"
            }`}
          >
            {item.label}
          </button>
        ))}
      </footer>
    </div>
  );
}
