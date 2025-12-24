"use client";

import { useEffect, useMemo, useState } from "react";
import {
  storage,
  type WorkoutSetup,
} from "@/lib/workout-engine/storage";
import { useVenueContext } from "@/lib/venue-context";
import { resolveBrandColors } from "@/lib/workout-engine/brand-colors";
import {
  fetchLatestBodyScan,
  listBodyScans,
  type BodyScanSummary,
} from "@/lib/integrations/visbody";

export default function BodyScanPage() {
  const { activeVenue } = useVenueContext();
  const [setup, setSetup] = useState<WorkoutSetup | null>(null);
  const [latestScan, setLatestScan] = useState<BodyScanSummary | null>(null);
  const [scanHistory, setScanHistory] = useState<BodyScanSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSetup(storage.getSetup());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadScans() {
      setIsLoading(true);
      try {
        const [latest, history] = await Promise.all([
          fetchLatestBodyScan(activeVenue?.id ?? null),
          listBodyScans(activeVenue?.id ?? null),
        ]);
        if (cancelled) return;
        setLatestScan(latest);
        setScanHistory(history);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadScans();
    return () => {
      cancelled = true;
    };
  }, [activeVenue?.id]);

  const brandColors = useMemo(
    () => resolveBrandColors({ activeVenue, setup }),
    [activeVenue, setup]
  );

  return (
    <main className="min-h-screen bg-black text-white p-6 lg:p-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
            Body Scan Intelligence
          </p>
          <h1 className="text-3xl font-bold" style={{ color: brandColors.primary }}>
            VisBody Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Pull the latest scans from VisBody, track progress, and sync highlights to the member
            profile.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          <div className="rounded-3xl border border-white/10 bg-neutral-950/80 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Latest Scan</h2>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {latestScan?.scannedAt
                  ? new Date(latestScan.scannedAt).toLocaleString()
                  : "Waiting for sync"}
              </span>
            </div>

            {isLoading ? (
              <div className="mt-8 text-center text-slate-400">Loading VisBody data…</div>
            ) : latestScan ? (
              <dl className="mt-6 grid gap-4 md:grid-cols-3">
                {["bodyFat", "muscleMass", "postureScore"].map((metric) => (
                  <div
                    key={metric}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
                  >
                    <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      {metric === "bodyFat" && "Body Fat %"}
                      {metric === "muscleMass" && "Lean Mass"}
                      {metric === "postureScore" && "Posture Score"}
                    </dt>
                    <dd className="mt-2 text-3xl font-bold" style={{ color: brandColors.accent }}>
                      {metric === "bodyFat" && `${latestScan.bodyFat}%`}
                      {metric === "muscleMass" && `${latestScan.muscleMass} kg`}
                      {metric === "postureScore" && latestScan.postureScore}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-white/20 p-6 text-sm text-slate-400">
                No scans found for this venue yet. Connect VisBody and run the first onboarding scan
                to populate data.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-neutral-950/80 p-6 shadow-xl">
            <h2 className="text-xl font-semibold">Next Actions</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="rounded-2xl border border-white/10 bg-black/40 p-3">
                » Export latest scan PDF to the member portal
              </li>
              <li className="rounded-2xl border border-white/10 bg-black/40 p-3">
                » Schedule a follow-up scan reminder (30 days cadence)
              </li>
              <li className="rounded-2xl border border-white/10 bg-black/40 p-3">
                » Push highlights to concierge dashboard
              </li>
            </ul>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-neutral-950/80 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Scan History</h2>
            <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {scanHistory.length} records
            </span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="pb-3">Member</th>
                  <th className="pb-3">Body Fat</th>
                  <th className="pb-3">Lean Mass</th>
                  <th className="pb-3">Posture</th>
                  <th className="pb-3">Scanned</th>
                </tr>
              </thead>
              <tbody>
                {scanHistory.slice(0, 6).map((scan) => (
                  <tr key={scan.id} className="border-t border-white/5 text-white/80">
                    <td className="py-3">{scan.memberName}</td>
                    <td className="py-3">{scan.bodyFat}%</td>
                    <td className="py-3">{scan.muscleMass} kg</td>
                    <td className="py-3">{scan.postureScore}</td>
                    <td className="py-3">{new Date(scan.scannedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
