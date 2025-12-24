"use client";

import MainLayout from "@/components/MainLayout";
import { NexusCard } from "@/components/ui/NexusCard";
import { NexusButton } from "@/components/ui/NexusButton";

const LINKS = [
  { label: "Branding", href: "/admin/brand", description: "BrandOS modules, visuals, assets, campaigns." },
  { label: "Financial Suite", href: "/admin/finance-suite", description: "KPIs, P&L, projections, revenue streams." },
  { label: "CRM & Guest", href: "/crm", description: "Messaging, UHIP tracker, guest journeys." },
  { label: "Gym / Studio", href: "/admin/workouts", description: "Workouts, HRM, timers & display logic." },
  { label: "Kitchen & Meals", href: "/kitchen/orders", description: "Orders, queue, fulfillment." },
  { label: "POS / Retail", href: "/pos", description: "Charges, payouts, retail ops." },
  { label: "Retreat Services", href: "/services", description: "Retreat planning and add-ons." },
  { label: "Analytics HQ", href: "/analytics", description: "Dashboards and export tools." },
  { label: "Venues", href: "/venues", description: "Multi-venue setup, branding, activation." },
  { label: "Setup", href: "/setup", description: "Device + display configuration." },
];

export default function AdminHomePage() {
  return (
    <MainLayout title="Admin Home" subtitle="HotelFit Admin">
      <div className="space-y-8">
        <NexusCard className="p-6 border-white/10 bg-black/30">
          <p className="text-sm text-slate-300">
            Unified admin for branding, finance, CRM, workouts, kitchen, POS, retreats, and analytics. All modules share the Nexus
            theme while core logic remains unchanged.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <NexusButton asChild size="sm" variant="secondary">
              <a href="/admin/brand">Branding</a>
            </NexusButton>
            <NexusButton asChild size="sm" variant="secondary">
              <a href="/admin/finance-suite">Finance Suite</a>
            </NexusButton>
            <NexusButton asChild size="sm" variant="secondary">
              <a href="/crm">CRM</a>
            </NexusButton>
            <NexusButton asChild size="sm" variant="secondary">
              <a href="/analytics">Analytics</a>
            </NexusButton>
          </div>
        </NexusCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LINKS.map((link) => (
            <NexusCard key={link.href} className="p-5 hover:border-cyan-300/40 transition">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{link.label}</h3>
                <NexusButton asChild size="sm" variant="ghost">
                  <a href={link.href}>Open</a>
                </NexusButton>
              </div>
              <p className="mt-3 text-sm text-slate-300">{link.description}</p>
            </NexusCard>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
