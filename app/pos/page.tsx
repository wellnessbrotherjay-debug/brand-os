"use client";

import { useEffect, useMemo, useState } from "react";
import { useVenueContext } from "@/lib/venue-context";
import { resolveBrandColors } from "@/lib/workout-engine/brand-colors";
import { listVenuePayouts, createPosCharge, type PosChargeRequest, type PayoutSummary } from "@/lib/integrations/stripe";
import MainLayout from "@/components/MainLayout";
import { NexusCard } from "@/components/ui/NexusCard";
import { NexusButton } from "@/components/ui/NexusButton";

export default function PosPage() {
  const { activeVenue } = useVenueContext();
  const [payouts, setPayouts] = useState<PayoutSummary[]>([]);
  const [form, setForm] = useState<PosChargeRequest>({
    amount: 2400,
    currency: "usd",
    description: "Recovery Smoothie",
    venueId: activeVenue?.id ?? "default",
  });
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    listVenuePayouts(activeVenue?.id ?? null).then(setPayouts);
  }, [activeVenue?.id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await createPosCharge({ ...form, venueId: activeVenue?.id ?? "default" });
    setStatus(`Charge ${result.status} · receipt ${result.receiptUrl}`);
  };

  const brandColors = useMemo(
    () => resolveBrandColors({ activeVenue }),
    [activeVenue]
  );

  return (
    <MainLayout title="POS & Revenue" subtitle="Stripe Connect">
      <div className="mx-auto max-w-5xl space-y-8">
        <p className="text-sm text-slate-300">
          Quickly run a POS charge or audit the latest payouts for this venue.
        </p>

        <NexusCard className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-200">
                Amount (cents)
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white"
                  type="number"
                  value={form.amount}
                  onChange={(event) => setForm((prev) => ({ ...prev, amount: Number(event.target.value) }))}
                />
              </label>
              <label className="text-sm text-slate-200">
                Description
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </label>
            </div>
            <NexusButton
              type="submit"
              className="w-full md:w-auto"
              style={{ backgroundColor: brandColors.accent, color: "#050b12" }}
            >
              Run Charge
            </NexusButton>
            {status && <p className="text-xs text-slate-400">{status}</p>}
          </form>
        </NexusCard>

        <NexusCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Payouts</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {payouts.map((payout) => (
              <div key={payout.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {new Date(payout.arrivalDate).toLocaleDateString()}
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {payout.amount / 100} {payout.currency.toUpperCase()}
                </p>
                <p className="text-slate-400">{payout.status}</p>
              </div>
            ))}
          </div>
        </NexusCard>
      </div>
    </MainLayout>
  );
}
