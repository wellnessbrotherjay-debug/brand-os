"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useBranding } from "@/lib/hooks/useBranding";
import BrandScreen from "@/components/BrandScreen";
import { supabase } from "@/lib/supabase";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  duration_minutes?: number | null;
  booking_url?: string | null;
};

const PLACEHOLDER_SERVICES: Service[] = [
  {
    id: "svc-pt",
    name: "Signature Personal Training",
    description: "Private suite session with Hotel Fit coach and bespoke programming.",
    duration_minutes: 60,
    price_cents: 22000,
    booking_url: "https://booking.hotelfit.com/pt",
  },
  {
    id: "svc-spa",
    name: "Thermal Reset Ritual",
    description: "Contrast therapy + guided breathwork curated by TS Suites spa team.",
    duration_minutes: 75,
    price_cents: 26000,
    booking_url: "https://booking.hotelfit.com/thermal",
  },
];

export default function ServicesPage() {
  const { brand, ready } = useBranding();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("hotel_services")
        .select("id, name, description, price_cents, duration_minutes, booking_url")
        .order("name", { ascending: true });
      if (error || !data?.length) {
        setServices(PLACEHOLDER_SERVICES);
      } else {
        setServices(data);
      }
      setLoading(false);
    };
    load().catch(() => {
      setServices(PLACEHOLDER_SERVICES);
      setLoading(false);
    });
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading…</div>;
  }

  return (
    <BrandScreen
      eyebrow="Concierge Services"
      title="Signature Services"
      description="Reserve spa rituals, PT sessions, and in-room enhancements curated with TS Suites."
      backHref="/home"
    >
      {loading ? (
        <p className="text-sm text-zinc-300">Loading services…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <motion.div
              key={service.id}
              whileHover={{ y: -4 }}
              className="rounded-3xl border border-white/10 bg-black/40 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">{service.name}</p>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                      {service.duration_minutes ? `${service.duration_minutes} min` : "Custom"}
                    </p>
                  </div>
                  <p className="text-sm" style={{ color: brand.accent }}>
                    ${((service.price_cents ?? 0) / 100).toFixed(2)}
                  </p>
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  {service.description ?? "Tailored service curated by Hotel Fit Solutions."}
                </p>
                {service.booking_url && (
                  <a
                    href={service.booking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/80 transition hover:bg-white/10"
                  >
                    Reserve
                  </a>
                )}
              </motion.div>
            ))}
        </div>
      )}
    </BrandScreen>
  );
}
