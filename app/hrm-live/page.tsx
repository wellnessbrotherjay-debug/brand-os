"use client";

import { useEffect, useMemo, useState } from "react";
import { useVenueContext } from "@/lib/venue-context";
import { resolveBrandColors } from "@/lib/workout-engine/brand-colors";
import {
  subscribeHeartRate,
  type LiveHeartRateSample,
} from "@/lib/integrations/ble";
import {
  storage,
  type WorkoutSetup,
} from "@/lib/workout-engine/storage";

export default function HrmLivePage() {
  const { activeVenue } = useVenueContext();
  const [setup, setSetup] = useState<WorkoutSetup | null>(null);
  const [samples, setSamples] = useState<LiveHeartRateSample[]>([]);

  useEffect(() => {
    setSetup(storage.getSetup());
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeHeartRate((nextSample) => {
      setSamples((prev) => {
        const next = [nextSample, ...prev];
        return next.slice(0, 12);
      });
    });
    return unsubscribe;
  }, []);

  const brandColors = useMemo(
    () => resolveBrandColors({ activeVenue, setup }),
    [activeVenue, setup]
  );

  return (
    <main className="min-h-screen bg-black text-white p-6 lg:p-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Live HRM</p>
          <h1 className="text-3xl font-bold" style={{ color: brandColors.primary }}>
            Realtime Studio Feed
          </h1>
          <p className="text-sm text-slate-400">
            The BLE bridge streams active heart rates into this dashboard before being pushed to the
            displays.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-neutral-950/80 p-6 shadow-xl">
          <h2 className="text-xl font-semibold">Current Streams</h2>
          {samples.length === 0 ? (
            <div className="mt-4 text-sm text-slate-400">
              Waiting for BLE monitors to broadcast…
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {samples.map((sample) => (
                <div
                  key={sample.id}
                  className="rounded-2xl border border-white/10 bg-black/60 p-4 shadow-inner"
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
                    <span>{sample.participantName}</span>
                    <span>Zone {sample.zone}</span>
                  </div>
                  <div className="mt-3 text-4xl font-bold" style={{ color: brandColors.accent }}>
                    {sample.heartRate} bpm
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    {new Date(sample.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
