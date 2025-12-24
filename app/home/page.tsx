"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import BrandScreen from "@/components/BrandScreen";
import { useBranding } from "@/lib/hooks/useBranding";
import { ensureGuestSession } from "@/lib/utils/guestSession";

const BUTTONS = [
  { label: "Marketing Suite", href: "/marketing", icon: "📣", blurb: "Campaigns, social, growth" },
  { label: "Brand OS", href: "/brand-book", icon: "🎨", blurb: "Identity, colors, and styles" },
  { label: "Finance", href: "/admin/finance-suite", icon: "📈", blurb: "P&L and financial tracking" },
  { label: "Facilities", href: "/facilities", icon: "🏛️", blurb: "Spa, pool, thermal suite" },
  { label: "Room Workouts", href: "/room-workout/builder", icon: "🛌", blurb: "Curate routines for guests" },
  { label: "Workouts", href: "/workouts", icon: "💪", blurb: "Stations, timers, playlists" },
  { label: "Menu", href: "/menu", icon: "🍽️", blurb: "Fuel, macros, chef picks" },
];

export default function HotelHomePage() {
  const router = useRouter();
  const { brand } = useBranding();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    ensureGuestSession()
      .then((id) => {
        if (id) setSessionId(id);
      })
      .catch((error) => console.warn("Guest session bootstrap failed", error));
  }, []);

  const handleNavigate = async (href: string) => {
    try {
      await router.push(href);
    } catch {
      console.log("Page not found");
    }
  };

  return (
    <BrandScreen
      eyebrow="GLVT Home Display"
      title={brand.name}
      description="Tailored in-room concierge by Hotel Fit Solutionss"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
            Session {sessionId ?? "syncing"}
          </span>
        </div>
      }
    >
      <div className="mb-6 rounded-3xl border border-white/12 bg-gradient-to-r from-black/50 via-slate-900/60 to-black/40 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 text-left">
            <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/80">Finance Suite</p>
            <h3 className="text-xl font-semibold text-white">BrandOS P&amp;L embedded in HotelFit</h3>
            <p className="text-sm text-zinc-300">
              Launch the finance cockpit without leaving admin. Same rounded shell and sidebar from port 3000.
            </p>
          </div>
          <Link
            href="/admin/finance-suite"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/60 bg-cyan-400/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-400/30"
          >
            Open Finance Suite →
          </Link>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-3">
        {BUTTONS.map((button) => (
          <motion.button
            key={button.href}
            onClick={() => handleNavigate(button.href)}
            whileHover={{ scale: 1.02, boxShadow: "0 30px 90px rgba(0,0,0,0.45)" }}
            whileTap={{ scale: 0.97 }}
            className="rounded-[30px] border border-white/10 bg-gradient-to-br from-black/45 via-slate-900/55 to-black/35 p-6 text-left shadow-[0_18px_65px_rgba(0,0,0,0.38)] backdrop-blur"
            style={{
              backgroundImage: `linear-gradient(135deg, ${brand.primary}22, ${brand.secondary}11)`,
            }}
          >
            <div className="text-5xl">{button.icon}</div>
            <div className="mt-6 text-2xl font-semibold tracking-tight">{button.label}</div>
            <p className="mt-2 text-sm text-zinc-300">{button.blurb}</p>
          </motion.button>
        ))}
      </div>
    </BrandScreen>
  );
}
