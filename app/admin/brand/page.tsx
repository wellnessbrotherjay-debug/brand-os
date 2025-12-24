"use server";

import Link from "next/link";
import MainLayout from "@/components/MainLayout";
import { NexusCard } from "@/components/ui/NexusCard";
import { financialProject, scenarioPresets } from "@/lib/financials";

const currency = (val: number, locale = "en-US", ccy = "USD") =>
  new Intl.NumberFormat(locale, { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(val);

const number = (val: number, locale = "en-US") =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(val);

export default async function BrandHubPage() {
  const totalCapex =
    financialProject.investments.reduce((sum, i) => sum + i.amount, 0) +
    financialProject.assets.reduce((sum, a) => sum + a.value, 0);
  const monthlyFixed = financialProject.fixedCosts.reduce((sum, c) => sum + c.monthlyAmount, 0);
  const variablePerBooking =
    financialProject.variableCosts.find((c) => c.costType === "per_booking")?.amount ?? 0;
  const baseScenario = scenarioPresets.base;
  const aggressiveScenario = scenarioPresets.aggressive;

  const tiles = [
    {
      title: "BrandOS Playbook",
      body: "Strategy, visual identity, and content engine for every venue.",
      action: "Open BrandOS",
      href: "/brand",
    },
    {
      title: "Finance / ROI",
      body: "P&L projections and ROI levers tied to bookings and memberships.",
      action: "Open Finance",
      href: "/admin/finance-suite",
    },
    {
      title: "CRM + Campaigns",
      body: "Use CRM + campaign tooling to push demand and fill classes.",
      action: "Open CRM",
      href: "/crm",
    },
  ];

  return (
    <MainLayout title="Brand & Marketing Hub" subtitle="Admin">
      <div className="space-y-8">
        <p className="text-slate-200">
          Strategy + finance stitched together for HotelFit. Deep-link into brand, finance, and CRM experiences without
          leaving the stack.
        </p>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NexusCard className="p-4">
            <p className="text-sm text-cyan-100/80">CAPEX + Assets</p>
            <p className="mt-2 text-3xl font-bold">{currency(totalCapex)}</p>
            <p className="mt-2 text-sm text-slate-300">Studio build, AV, equipment</p>
          </NexusCard>
          <NexusCard className="p-4">
            <p className="text-sm text-cyan-100/80">Monthly Fixed Costs</p>
            <p className="mt-2 text-3xl font-bold">{currency(monthlyFixed)}</p>
            <p className="mt-2 text-sm text-slate-300">Rent, salaries, utilities, marketing</p>
          </NexusCard>
          <NexusCard className="p-4">
            <p className="text-sm text-cyan-100/80">Variable / booking</p>
            <p className="mt-2 text-3xl font-bold">{currency(variablePerBooking)}</p>
            <p className="mt-2 text-sm text-slate-300">Consumables + per-guest ops</p>
          </NexusCard>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NexusCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Base Scenario</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-cyan-100">Demand model</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
              <div>
                <p className="text-cyan-100/80">Classes / day</p>
                <p className="text-lg font-bold">{baseScenario.avgClassesPerDay}</p>
              </div>
              <div>
                <p className="text-cyan-100/80">Clients / class</p>
                <p className="text-lg font-bold">{baseScenario.avgClientsPerClass}</p>
              </div>
              <div>
                <p className="text-cyan-100/80">Memberships</p>
                <p className="text-lg font-bold">{number(baseScenario.avgMemberships)}</p>
              </div>
              <div>
                <p className="text-cyan-100/80">Occupancy</p>
                <p className="text-lg font-bold">{baseScenario.occupancyPercent}%</p>
              </div>
            </div>
          </NexusCard>
          <NexusCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Aggressive Scenario</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-amber-400/20 text-amber-200">Stretch</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
              <div>
                <p className="text-cyan-100/80">Classes / day</p>
                <p className="text-lg font-bold">{aggressiveScenario.avgClassesPerDay}</p>
              </div>
              <div>
                <p className="text-cyan-100/80">Clients / class</p>
                <p className="text-lg font-bold">{aggressiveScenario.avgClientsPerClass}</p>
              </div>
              <div>
                <p className="text-cyan-100/80">Memberships</p>
                <p className="text-lg font-bold">{number(aggressiveScenario.avgMemberships)}</p>
              </div>
              <div>
                <p className="text-cyan-100/80">Occupancy</p>
                <p className="text-lg font-bold">{aggressiveScenario.occupancyPercent}%</p>
              </div>
            </div>
          </NexusCard>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {tiles.map((tile) => (
            <NexusCard key={tile.title} className="p-5 flex flex-col gap-3">
              <div>
                <h3 className="text-xl font-semibold">{tile.title}</h3>
                <p className="mt-2 text-sm text-slate-200">{tile.body}</p>
              </div>
              <Link
                href={tile.href}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500/90 to-emerald-400/90 text-neutral-950 font-semibold px-4 py-2 hover:from-cyan-400 hover:to-emerald-300 transition-colors shadow-[0_15px_40px_rgba(34,211,238,0.35)]"
              >
                {tile.action}
              </Link>
            </NexusCard>
          ))}
        </section>
      </div>
    </MainLayout>
  );
}
