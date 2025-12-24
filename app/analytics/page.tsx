"use client";

import { useMemo } from "react";
import { useVenueContext } from "@/lib/venue-context";
import { resolveBrandColors } from "@/lib/workout-engine/brand-colors";
import MainLayout from "@/components/MainLayout";
import { NexusCard } from "@/components/ui/NexusCard";

const ANALYTICS = [
  { label: "Active Members", value: 128, trend: "+6%" },
  { label: "Avg TDEE", value: "2,180 kcal", trend: "+2%" },
  { label: "Class Occupancy", value: "84%", trend: "+11%" },
  { label: "Revenue / Venue", value: "$12,450", trend: "+4%" },
];

export default function AnalyticsPage() {
  const { activeVenue } = useVenueContext();
  const brandColors = useMemo(() => resolveBrandColors({ activeVenue }), [activeVenue]);
  const safeColor = brandColors?.primary ?? "#22d3ee";

  return (
    <MainLayout title="Hotel Fit Analytics" subtitle="Insights">
      <div className="mx-auto max-w-6xl space-y-8">
        <p className="text-sm text-slate-300">
          Data warehouse summary fed by Supabase cron jobs. Replace with Metabase or Looker as soon as the dataset
          stabilizes.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {ANALYTICS.map((item) => (
            <NexusCard key={item.label} className="p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.label}</p>
              <p className="mt-3 text-3xl font-bold" style={{ color: safeColor }}>
                {item.value}
              </p>
              <p className="text-xs text-emerald-400">{item.trend} vs last week</p>
            </NexusCard>
          ))}
        </div>

        <NexusCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Engagement Snapshot</h2>
          <div className="space-y-4">
            {["HR Zone Mix", "Body Scan Coverage", "POS Revenue"].map((title) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>{title}</span>
                  <span>Coming Soon</span>
                </div>
                <div className="mt-4 h-24 rounded-xl bg-gradient-to-r from-white/10 to-transparent" />
              </div>
            ))}
          </div>
        </NexusCard>
      </div>
    </MainLayout>
  );
}
