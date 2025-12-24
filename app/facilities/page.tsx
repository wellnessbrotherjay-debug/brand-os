"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useBranding } from "@/lib/hooks/useBranding";
import BrandScreen from "@/components/BrandScreen";
import { supabase } from "@/lib/supabase";

type Facility = {
  id: string;
  name: string;
  description: string | null;
  hours?: string | null;
  icon?: string | null;
  booking_url?: string | null;
  image_url?: string | null;
};

const PLACEHOLDER: Facility[] = [
  {
    id: "pool",
    name: "Skyline Pool Deck",
    description: "Heated infinity pools · cabanas · sunset DJs",
    booking_url: "https://booking.hotelfit.com/cabana",
    image_url: "/assets/facilities/pool.jpg",
  },
  {
    id: "recovery",
    name: "Recovery Lab",
    description: "Infrared saunas, cold plunge, compression boots",
    booking_url: "https://booking.hotelfit.com/recovery-lab",
    image_url: "/assets/facilities/recovery.jpg",
  },
  {
    id: "studio",
    name: "Movement Studio",
    description: "Yoga, reformers, functional circuits",
    booking_url: "https://booking.hotelfit.com/studio",
    image_url: "/assets/facilities/studio.jpg",
  },
  {
    id: "lounge",
    name: "Executive Lounge",
    description: "Co-working by day · curated mocktails by night",
    booking_url: "mailto:concierge@hotelfit.com",
    image_url: "/assets/facilities/lounge.jpg",
  },
];

export default function FacilitiesPage() {
  const { ready } = useBranding();
  const [facilities, setFacilities] = useState<Facility[]>(PLACEHOLDER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("facilities").select("id, name, description, hours, icon, booking_url, image_url");
      if (error || !data?.length) {
        setFacilities(PLACEHOLDER);
      } else {
        setFacilities(
          data.map((facility) => ({
            id: facility.id,
            name: facility.name,
            description: facility.description,
            hours: (facility as any).hours,
            icon: (facility as any).icon,
            booking_url: (facility as any).booking_url,
            image_url: (facility as any).image_url,
          }))
        );
      }
      setLoading(false);
    };
    load().catch((error) => {
      console.warn("Facilities load failed", error);
      setFacilities(PLACEHOLDER);
      setLoading(false);
    });
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading…</div>;
  }

  return (
    <BrandScreen
      eyebrow="Hotel Fit Facilities"
      title="Facilities"
      description="Explore TS Suites-inspired amenities tailored to your stay."
      backHref="/home"
    >
      {loading ? (
        <p className="text-sm text-zinc-300">Loading facilities…</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {facilities.map((facility) => (
            <motion.div
              key={facility.id}
              whileHover={{ y: -6 }}
              className="rounded-3xl border border-white/10 bg-black/45 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
            >
              {facility.image_url && (
                <div
                  className="mb-4 h-40 w-full rounded-2xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${facility.image_url})` }}
                  role="img"
                  aria-label={facility.name}
                />
              )}
              <p className="text-lg font-semibold flex items-center gap-2">
                {facility.icon && <span className="text-2xl">{facility.icon}</span>}
                {facility.name}
              </p>
              <p className="text-sm text-slate-300">{facility.description}</p>
              {facility.hours && <p className="mt-2 text-xs text-slate-400">Hours: {facility.hours}</p>}
              <a
                href={facility.booking_url ?? "mailto:concierge@hotelfit.com"}
                target={facility.booking_url ? "_blank" : undefined}
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/80 transition hover:bg-white/10"
              >
                Book Now
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </BrandScreen>
  );
}
