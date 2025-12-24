"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  storage,
  VENUES_UPDATED_EVENT,
  DEFAULT_SETUP,
  type WorkoutSetup,
  type VenueProfile,
  type BrandPalette,
} from "@/lib/workout-engine/storage";
import { systemFeatures } from "@/lib/system-features";
import MainLayout from "@/components/MainLayout";
import { NexusCard } from "@/components/ui/NexusCard";
import { NexusButton } from "@/components/ui/NexusButton";

const DEFAULT_BRAND_COLORS: BrandPalette = {
  primary: "#00BFFF",
  secondary: "#14B8A6",
  accent: "#F59E0B",
};

type VenueFormState = {
  name: string;
  logo: string;
  primary: string;
  secondary: string;
  accent: string;
};

export default function HomePage() {
  const [setup, setSetup] = useState<WorkoutSetup | null>(null);
  const [venues, setVenues] = useState<VenueProfile[]>([]);
  const [activeVenue, setActiveVenue] = useState<VenueProfile | null>(null);
  const [venueForm, setVenueForm] = useState<VenueFormState>({
    name: "",
    logo: "",
    primary: DEFAULT_BRAND_COLORS.primary,
    secondary: DEFAULT_BRAND_COLORS.secondary,
    accent: DEFAULT_BRAND_COLORS.accent,
  });
  const [venueError, setVenueError] = useState<string | null>(null);

  useEffect(() => {
    const workoutSetup = storage.getSetup();
    setSetup(workoutSetup ?? DEFAULT_SETUP);
    setVenues(storage.getVenues());
    setActiveVenue(storage.getActiveVenue());

    const handleVenueUpdate = () => {
      setVenues(storage.getVenues());
      setActiveVenue(storage.getActiveVenue());
    };

    window.addEventListener(VENUES_UPDATED_EVENT, handleVenueUpdate);

    // Auto-fix branding if it's still stuck on defaults
    if (workoutSetup?.facilityName === "Sammy's Club" || workoutSetup?.facilityName === "MGM Hotel Gym") {
      storage.saveSetup({
        ...workoutSetup,
        facilityName: "Hotel Fit Solutionss",
        logo: "https://r2.erweima.ai/img/compressed/378812c3f156687071e2170364d93026.png"
      });
      setSetup({
        ...workoutSetup,
        facilityName: "Hotel Fit Solutionss",
        logo: "https://r2.erweima.ai/img/compressed/378812c3f156687071e2170364d93026.png"
      });
    }

    return () => window.removeEventListener(VENUES_UPDATED_EVENT, handleVenueUpdate);
  }, []);

  const handleVenueFormChange = (field: keyof VenueFormState, value: string) => {
    setVenueForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleVenueSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setVenueError(null);
    if (!venueForm.name.trim()) {
      setVenueError("Venue name is required.");
      return;
    }
    const colors: BrandPalette = {
      primary: venueForm.primary,
      secondary: venueForm.secondary,
      accent: venueForm.accent,
    };
    const newVenue = storage.createVenue({
      name: venueForm.name.trim(),
      logo: venueForm.logo.trim() || null,
      colors,
    });
    if (!newVenue) {
      setVenueError("Unable to create venue. Please try again.");
      return;
    }
    setVenueForm({
      name: "",
      logo: "",
      primary: venueForm.primary,
      secondary: venueForm.secondary,
      accent: venueForm.accent,
    });
    setActiveVenue(newVenue);
  };

  const handleActivateVenue = (venueId: string) => {
    storage.setActiveVenueId(venueId);
    setActiveVenue(storage.getActiveVenue());
  };

  if (!setup) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-xl font-bold">Loading...</div>
        </div>
      </div>
    );
  }

  const features = systemFeatures;

  const mobileSuiteFeatures = [
    {
      title: "Workout Remote",
      description: "Guests run the entire station flow from their phone.",
      href: "/mobile",
    },
    {
      title: "Room Service Sync",
      description: "Push fuel orders straight to the kitchen queue.",
      href: "/room/101/food",
    },
    {
      title: "HRM Companion",
      description: "Mirror live HR data and cues outside the TV wall.",
      href: "/hrm-live",
    },
  ];

  const operationalSystems = [
    {
      title: "Body Scan Lab",
      description: "VisBody dashboards + scan history for every guest",
      href: "/body-scan",
    },
    {
      title: "TDEE Lab",
      description: "Calorie + macro planning with instant recommendations",
      href: "/tdee",
    },
    {
      title: "HRM Live Floor",
      description: "Live BLE heart-rate monitoring outside the TV wall",
      href: "/hrm-live",
    },
    {
      title: "POS & Retail",
      description: "Stripe-powered checkout for merch, passes, or add-ons",
      href: "/pos",
    },
    {
      title: "CRM Drip Center",
      description: "Customer follow-ups, automations, and reminders",
      href: "/crm",
    },
    {
      title: "Analytics HQ",
      description: "High-level KPIs ready for Metabase/Looker handoff",
      href: "/analytics",
    },
    {
      title: "Financials & ROI",
      description: "Model pricing, compare competitors, and simulate breakeven in seconds",
      href: "/financials",
    },
    {
      title: "Kitchen & Meals",
      description: "Track meal orders and menu macros",
      href: "/kitchen/orders",
    },
    {
      title: "Mobile QA Sandbox",
      description: "Device previews & tooling for the phone experience",
      href: "/mobile",
    },
  ];

  const displayColors = activeVenue?.colors ?? setup.colors ?? DEFAULT_SETUP.colors ?? DEFAULT_BRAND_COLORS;
  const displayName = activeVenue?.name ?? setup.facilityName ?? DEFAULT_SETUP.facilityName;
  const displayLogo = activeVenue?.logo ?? setup.logo;

  return (
    <MainLayout
      title={displayName || "Hotel Fit Solutionss"}
      subtitle="Complete Workout Management System"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <NexusButton asChild size="sm" variant="secondary">
            <a href="/">🌐 Marketing Site</a>
          </NexusButton>
          <NexusButton asChild size="sm" variant="secondary">
            <a href="/brand-book">🎨 Brand OS</a>
          </NexusButton>
          <NexusButton asChild size="sm" variant="secondary">
            <a href="/admin/brand">🔐 Admin Login</a>
          </NexusButton>
          <NexusButton asChild size="sm" variant="secondary">
            <a href="/admin/finance-suite">Open Finance Suite</a>
          </NexusButton>
          <NexusButton asChild size="sm" variant="secondary">
            <a href="/setup">Open Setup</a>
          </NexusButton>
          <NexusButton asChild size="sm" variant="secondary">
            <a href="/venues">Manage Venues</a>
          </NexusButton>
          <NexusButton asChild size="sm" variant="secondary">
            <a href="/mobile">Test Mobile App</a>
          </NexusButton>
        </div>
      }
    >
      <div className="flex flex-col gap-10">
        <NexusCard className="p-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Mobile Command</p>
              <h2 className="text-3xl font-semibold text-white">All gym functions in your hand</h2>
              <p className="text-sm text-slate-300">
                The mobile experience mirrors the TV wall, controls stations, pushes HRM data, and submits kitchen
                tickets. Give staff and guests the same toolkit without leaving their phone.
              </p>
              <NexusButton asChild size="md" variant="primary">
                <a href="/mobile">Launch Mobile Suite →</a>
              </NexusButton>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {mobileSuiteFeatures.map((tile) => (
                <NexusCard key={tile.href} className="p-4 bg-white/5 border-white/10">
                  <div className="heading-font text-[11px] uppercase tracking-[0.4em] text-sky-300">{tile.title}</div>
                  <p className="mt-3 text-xs text-slate-300">{tile.description}</p>
                </NexusCard>
              ))}
            </div>
          </div>
        </NexusCard>

        <NexusCard className="p-8 border-emerald-500/20 bg-gradient-to-br from-emerald-900/40 via-slate-900/50 to-slate-950/60">
          <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">New v3</p>
              <h2 className="text-3xl font-semibold text-white">Financials & ROI Live Preview</h2>
              <p className="text-sm text-slate-200">
                Map costs, bookings, and competitor pricing in one screen before the Supabase sync finishes. Slide
                scenarios, watch payback move, and seed your pricing decisions long before the database tables exist.
              </p>
              <ul className="mt-4 space-y-2 text-[13px] text-slate-300">
                <li>• Scenario sliders for classes/day, memberships, day passes, and occupancy</li>
                <li>• Live KPI badges for profitability, payback months, and annual ROI</li>
                <li>• Competitor match actions that seed pricing from Body Factory, Paradise Bali, and Ocean Club</li>
                <li>• Revenue/cost bar view so you see breakeven & profit at a glance</li>
              </ul>
              <NexusButton asChild size="md" variant="secondary">
                <a href="/financials">Open ROI studio →</a>
              </NexusButton>
            </div>
            <NexusCard className="p-6 text-sm text-slate-200 border-emerald-400/30 bg-black/40 shadow-[0_25px_80px_rgba(8,42,29,0.45)]">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Ready for hotel investors</p>
              <p className="mt-3 text-sm text-white">
                Jay can now simulate 3 classes/day, tweak drop-in pricing, and instantly see breakeven versus rent and
                salaries. This mock view stays synced with the simulator even while Supabase roles are pending.
              </p>
              <div className="mt-6 grid gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Mock investment</span>
                  <span>$153k</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Monthly profit</span>
                  <span>$27k</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payback</span>
                  <span>5.8 months</span>
                </div>
              </div>
            </NexusCard>
          </div>
        </NexusCard>

        <NexusCard className="p-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-sky-400/80">Venue Profiles</p>
              <h2 className="heading-font text-2xl text-white mt-2">{displayName}</h2>
              <p className="mt-2 text-sm text-slate-400">
                Create venue-specific branding that the builder and displays can reference without impacting other hotel
                systems.
              </p>

              {displayLogo ? (
                <img
                  src={displayLogo}
                  alt={displayName ?? "Active venue"}
                  className="mt-4 h-12 w-auto rounded bg-white/10 p-2 object-contain"
                />
              ) : null}

              <div className="mt-6 flex gap-3">
                {(["primary", "secondary", "accent"] as const).map((token) => (
                  <div key={token} className="flex flex-col items-center text-xs uppercase tracking-[0.3em] text-slate-400">
                    <div className="h-10 w-10 rounded-full border border-white/10" style={{ backgroundColor: displayColors[token] }} />
                    <span className="mt-2">{token}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Saved Venues</p>
                {venues.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {venues.map((venue) => {
                      const isActive = venue.id === activeVenue?.id;
                      return (
                        <button
                          key={venue.id}
                          type="button"
                          onClick={() => handleActivateVenue(venue.id)}
                          className={`rounded-full border px-4 py-1 text-xs uppercase tracking-[0.2em] transition ${isActive
                            ? "border-sky-400 text-white"
                            : "border-white/20 text-slate-400 hover:border-sky-300/60 hover:text-white"
                            }`}
                        >
                          {venue.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">No venues yet. Use the form to add your first property.</p>
                )}
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleVenueSubmit}>
              <div>
                <label className="text-xs uppercase tracking-[0.35em] text-slate-400">Venue Name</label>
                <input
                  type="text"
                  value={venueForm.name}
                  onChange={(event) => handleVenueFormChange("name", event.target.value)}
                  placeholder="Sunset Tower Wellness"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.35em] text-slate-400">Logo URL</label>
                <input
                  type="url"
                  value={venueForm.logo}
                  onChange={(event) => handleVenueFormChange("logo", event.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(["primary", "secondary", "accent"] as const).map((token) => (
                  <div key={token}>
                    <label className="text-xs uppercase tracking-[0.35em] text-slate-400">{token}</label>
                    <input
                      type="color"
                      value={venueForm[token]}
                      onChange={(event) => handleVenueFormChange(token, event.target.value)}
                      className="mt-1 h-12 w-full cursor-pointer rounded border border-white/10 bg-black/30"
                    />
                  </div>
                ))}
              </div>
              {venueError ? <p className="text-sm text-red-400">{venueError}</p> : null}
              <NexusButton type="submit" size="md" variant="secondary" className="w-full">
                Save Venue
              </NexusButton>
            </form>
          </div>
        </NexusCard>

        <section className="space-y-6">
          <div className="text-center">
            <h2 className="heading-font text-3xl uppercase tracking-[0.35em] text-slate-300">System Features</h2>
            <p className="mt-3 text-sm text-slate-400">Launch any display or control surface directly from your dashboard.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
            {features.map((feature) => (
              <NexusCard
                key={feature.href}
                className="p-6 text-left bg-black/35 border-white/10 hover:border-sky-400/40 hover:shadow-[0_0_32px_rgba(0,175,255,0.25)] transition"
              >
                <a href={feature.href}>
                  <div className="heading-font text-xs uppercase tracking-[0.35em] text-sky-300">{feature.title}</div>
                  <p className="mt-4 text-sm text-slate-300">{feature.description}</p>
                </a>
              </NexusCard>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="text-center">
            <h2 className="heading-font text-3xl uppercase tracking-[0.35em] text-slate-300">Operational Systems</h2>
            <p className="mt-3 text-sm text-slate-400">
              Quickly jump into the new Stage&nbsp;1.5 modules for ops teams, finance, and analytics.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {operationalSystems.map((system) => (
              <NexusCard
                key={system.href}
                className="p-6 text-left bg-gradient-to-b from-black/40 to-black/20 border-white/12 hover:border-emerald-400/40 hover:shadow-[0_0_32px_rgba(34,197,94,0.25)] transition"
              >
                <a href={system.href}>
                  <div className="heading-font text-xs uppercase tracking-[0.35em] text-emerald-300">{system.title}</div>
                  <p className="mt-4 text-sm text-slate-300">{system.description}</p>
                </a>
              </NexusCard>
            ))}
          </div>
        </section>

        <NexusCard className="grid grid-cols-2 gap-4 p-6 text-center md:grid-cols-4">
          <div>
            <div className="heading-font text-3xl font-semibold text-sky-200">{setup.stations?.length || 0}</div>
            <div className="text-xs uppercase tracking-[0.35em] text-slate-400">Stations</div>
          </div>
          <div>
            <div className="heading-font text-3xl font-semibold text-sky-200">{setup.rounds}</div>
            <div className="text-xs uppercase tracking-[0.35em] text-slate-400">Rounds</div>
          </div>
          <div>
            <div className="heading-font text-3xl font-semibold text-sky-200">{setup.workTime}s</div>
            <div className="text-xs uppercase tracking-[0.35em] text-slate-400">Work Time</div>
          </div>
          <div>
            <div className="heading-font text-3xl font-semibold text-sky-200">{setup.restTime}s</div>
            <div className="text-xs uppercase tracking-[0.35em] text-slate-400">Rest Time</div>
          </div>
        </NexusCard>

        <footer className="border-t border-white/10 pt-6 text-center text-xs uppercase tracking-[0.3em] text-slate-500">
          Unified displays • Real-time synchronization • Mobile & TV experiences
        </footer>
      </div>
    </MainLayout>
  );
}
