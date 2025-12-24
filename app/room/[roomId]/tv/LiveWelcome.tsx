"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { EventCard, MenuHighlight, WelcomeContext } from "./context";

type LiveWelcomeProps = {
  initialContext: WelcomeContext;
  roomId: string;
};

const AMBIENT_TRACK =
  "https://cdn.pixabay.com/download/audio/2023/01/20/audio_2fb74a0be7.mp3?filename=elegant-lobby-133412.mp3";

const FACILITY_FEATURES = [
  { label: "Thermal Suite", description: "Infrared saunas + contrast plunge" },
  { label: "Aqua Lounge", description: "Adults-only pool & cabanas" },
  { label: "Movement Lab", description: "TRX, reformers, Peloton deck" },
  { label: "Concierge Chat", description: "Scan the QR to text requests" },
];

export function LiveWelcome({ initialContext, roomId }: LiveWelcomeProps) {
  const [context, setContext] = useState(initialContext);
  const [syncing, setSyncing] = useState(false);

  const greeting = useMemo(() => getGreeting(), []);
  const firstName = context.guestName.split(" ")[0] ?? "there";
  const actions = useMemo(() => getPrimaryActions(roomId), [roomId]);

  useEffect(() => {
    const channel = supabase
      .channel(`room-tv-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `room_id=eq.${roomId}` },
        handleChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

    async function handleChange() {
      setSyncing(true);
      try {
        const response = await fetch(`/api/rooms/${roomId}/welcome`, { cache: "no-store" });
        if (!response.ok) return;
        const json = await response.json();
        setContext(json.context as WelcomeContext);
      } catch (error) {
        console.warn("[tv] failed to refresh context", error);
      } finally {
        setSyncing(false);
      }
    }
  }, [roomId]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.25),_transparent_55%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-950/70 to-black" />

      <div className="relative z-10 flex h-screen flex-col gap-6 px-10 py-8">
        <header className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.5em] text-slate-300/80">
              {context.roomName ?? "Skyline Suite"}
            </p>
            {syncing && (
              <span className="text-xs uppercase tracking-[0.4em] text-emerald-200">Syncing…</span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-emerald-200/80">
                Enjoy your stay
              </p>
              <h1 className="text-4xl font-semibold leading-tight lg:text-5xl">
                {greeting}, {firstName}.
              </h1>
              <p className="text-lg text-slate-200">
                Welcome back, {context.guestName}. We curated workouts, dining,
                and happenings around your booking.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 uppercase tracking-[0.3em] text-xs text-white/80">
                concierge on call
              </span>
              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2">
                Sound · Lobby mix
              </span>
            </div>
          </div>
        </header>

        <main className="grid flex-1 grid-cols-12 gap-6">
          <section className="col-span-7 flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-8 shadow-[0_25px_90px_rgba(15,23,42,0.45)] backdrop-blur-xl">
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-200/70">
                    Smart menu
                  </p>
                  <h2 className="text-3xl font-semibold">Choose your flow</h2>
                  <p className="text-base text-slate-200">
                    Tap an experience below and it will launch on this TV or the
                    in-room tablet. Everything syncs to your membership.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {actions.map((action) => (
                    <Link
                      key={action.title}
                      href={action.href}
                      className={`group rounded-2xl border border-white/10 bg-gradient-to-br ${action.accent} p-5 transition hover:border-white/40`}
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-white/80">
                        {action.pill}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-white">
                        {action.title}
                      </h3>
                      <p className="text-sm text-white/80">{action.description}</p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white">
                        {action.cta}
                        <span aria-hidden>↗</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-7 backdrop-blur-3xl">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-300/70">
                    Stay details
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-6 text-slate-100">
                    <div>
                      <p className="text-sm text-slate-400">Check-in</p>
                      <p className="text-2xl font-semibold">
                        {formatDisplayDate(context.booking.checkIn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Check-out</p>
                      <p className="text-2xl font-semibold">
                        {formatDisplayDate(context.booking.checkOut)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Nights</p>
                      <p className="text-2xl font-semibold">
                        {context.booking.nights}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-sky-500/20 px-5 py-4 text-sm text-slate-100">
                  {context.booking.packageName} · Concierge has your playlist
                  and pillow preferences on file.
                </div>
              </div>
            </div>
          </section>

          <aside className="col-span-5 flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300/80">
                Today&apos;s events
              </p>
              <div className="mt-4 space-y-4">
                {context.events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/5 p-4"
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
                      {formatEventTime(event.startsAt)}
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{event.title}</p>
                      <p className="text-sm text-slate-300">{event.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-200/80">
                Chef&apos;s picks
              </p>
              <div className="mt-4 space-y-4">
                {context.menuHighlights.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/30 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="text-base font-semibold text-white">
                        {item.name}
                      </p>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
                        {item.subtitle}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-white/90">
                      {item.price}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-300">
                Order anytime · Delivered under 25 minutes · Tap “Order Dining”.
              </p>
            </div>
          </aside>
        </main>

        <footer className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Hotel facilities
          </p>
          <div className="flex flex-wrap gap-4">
            {FACILITY_FEATURES.map((feature) => (
              <div
                key={feature.label}
                className="min-w-[220px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100"
              >
                <p className="font-semibold">{feature.label}</p>
                <p className="text-xs text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </footer>
      </div>

      <AmbientAudio src={AMBIENT_TRACK} />
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDisplayDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "EEE, MMM d");
}

function formatEventTime(value: string | null) {
  if (!value) return "All day";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "All day";
  return format(date, "EEE · h:mm a");
}

function getPrimaryActions(roomId: string) {
  return [
    {
      title: "Start Workout",
      description: "Coach-led circuits, stretching & guided yoga",
      href: `/room/${roomId}/player`,
      cta: "Launch player",
      pill: "Movement",
      accent: "from-cyan-500/60 to-sky-500/40",
    },
    {
      title: "Order Dining",
      description: "Plant-forward meals & tonics delivered in-room",
      href: `/room/${roomId}/food`,
      cta: "Browse menu",
      pill: "Dining",
      accent: "from-amber-500/50 to-rose-500/50",
    },
    {
      title: "Hotel Events",
      description: "Live music, masterclasses, tastings & more",
      href: "/mobile",
      cta: "View calendar",
      pill: "Social",
      accent: "from-violet-500/50 to-indigo-500/50",
    },
    {
      title: "Facilities & Spa",
      description: "Reserve spa rituals, pool beds, or personal training",
      href: "/venues",
      cta: "See options",
      pill: "Wellness",
      accent: "from-emerald-500/50 to-teal-500/40",
    },
  ];
}

function AmbientAudio({ src }: { src: string }) {
  return (
    <audio
      src={src}
      autoPlay
      loop
      preload="auto"
      aria-hidden="true"
      className="sr-only"
    />
  );
}
