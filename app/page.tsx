"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  storage,
  VENUES_UPDATED_EVENT,
  DEFAULT_SETUP,
  type WorkoutSetup,
  STORAGE_KEYS,
  getActiveStudioId,
  setActiveStudioId,
  type VenueProfile,
  type BrandPalette,
  type SessionPhase,
} from "@/lib/workout-engine/storage";
import { systemFeatures, getFeaturesForStudio } from "@/lib/system-features";
import MainLayout from "@/components/MainLayout";
import { NexusCard } from "@/components/ui/NexusCard";
import { NexusButton } from "@/components/ui/NexusButton";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const PHASE_LABEL: Record<SessionPhase, string> = {
  prep: "Get Ready",
  work: "Work",
  rest: "Rest",
  change: "Station Change",
  complete: "Complete",
};

const PHASE_COLOR: Record<SessionPhase, string> = {
  prep: "#F1EDE5", // Beige
  work: "#FF4D4D", // Red
  rest: "#C8A871", // Gold
  change: "#C8A871", // Gold
  complete: "#C0C0C0", // Silver/Complete
};

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
  const [activeStudio, setActiveStudio] = useState<string>('studio-a');
  const [venueForm, setVenueForm] = useState<VenueFormState>({
    name: "",
    logo: "",
    primary: DEFAULT_BRAND_COLORS.primary,
    secondary: DEFAULT_BRAND_COLORS.secondary,
    accent: DEFAULT_BRAND_COLORS.accent,
  });
  const [venueError, setVenueError] = useState<string | null>(null);
  const [globalTimer, setGlobalTimer] = useState({
    timeLeft: 0,
    phase: 'prep' as SessionPhase,
    isActive: false,
    targetEndTime: null as Date | null,
  });

  useEffect(() => {
    const workoutSetup = storage.getSetup();
    setSetup(workoutSetup ?? DEFAULT_SETUP);
    setVenues(storage.getVenues());
    setActiveVenue(storage.getActiveVenue());
    setActiveStudio(storage.getActiveStudioId());

    const handleVenueUpdate = () => {
      setVenues(storage.getVenues());
      setActiveVenue(storage.getActiveVenue());
      setActiveStudio(storage.getActiveStudioId());
    };

    window.addEventListener(VENUES_UPDATED_EVENT, handleVenueUpdate);

    // Auto-fix branding if it's still stuck on defaults
    if (workoutSetup?.facilityName === "Sammy's Club" || workoutSetup?.facilityName === "MGM Hotel Gym") {
      storage.saveSetup({
        ...workoutSetup,
        facilityName: "AVLR",
        logo: "https://r2.erweima.ai/img/compressed/378812c3f156687071e2170364d93026.png"
      });
      setSetup({
        ...workoutSetup,
        facilityName: "AVLR",
        logo: "https://r2.erweima.ai/img/compressed/378812c3f156687071e2170364d93026.png"
      });
    }

    return () => window.removeEventListener(VENUES_UPDATED_EVENT, handleVenueUpdate);
  }, []);

  // Global timer subscription (READ-ONLY)
  useEffect(() => {
    if (!supabaseClient) return;

    // Subscribe to global timer changes
    const timerChannel = supabaseClient
      .channel('global-timer-home')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'global_timer', filter: 'id=eq.active' }, (payload) => {
        const timerData = payload.new as any;
        console.log('Home: Global timer update received:', timerData);
        if (timerData && timerData.target_end_time) {
          // Calculate time left from target end time - this eliminates lag!
          const targetEndTime = new Date(timerData.target_end_time).getTime();
          const now = Date.now();
          const calculatedTimeLeft = Math.max(0, Math.ceil((targetEndTime - now) / 1000));

          setGlobalTimer({
            timeLeft: calculatedTimeLeft,
            phase: timerData.phase || 'prep',
            isActive: timerData.is_active || false,
            targetEndTime: new Date(timerData.target_end_time),
          });
          console.log('Home: Calculated timeLeft from target:', calculatedTimeLeft);
        } else if (timerData) {
          // Fallback to old method if target_end_time not available
          setGlobalTimer({
            timeLeft: timerData.time_left || 0,
            phase: timerData.phase || 'prep',
            isActive: timerData.is_active || false,
            targetEndTime: null,
          });
        }
      })
      .subscribe();

    // Local countdown that calculates from target time
    const localInterval = setInterval(() => {
      setGlobalTimer(prev => {
        if (!prev.isActive || !prev.targetEndTime) return prev;

        // Calculate time left from target end time
        const targetEndTime = prev.targetEndTime.getTime();
        const now = Date.now();
        let calculatedTimeLeft = Math.max(0, Math.ceil((targetEndTime - now) / 1000));

        // Prevent showing 0 if timer should be active and time > 0
        if (calculatedTimeLeft === 0 && (targetEndTime - now) > 1000) {
          // Target time is in the future but calculation gave 0, use fallback
          calculatedTimeLeft = prev.timeLeft || 1;
        }

        return {
          ...prev,
          timeLeft: calculatedTimeLeft,
        };
      });
    }, 100); // Update every 100ms for smooth countdown

    // Fetch initial timer state (READ-ONLY) - do this immediately
    const fetchTimer = async () => {
      console.log('Home: Fetching initial timer state...');
      const { data, error } = await supabaseClient
        .from('global_timer')
        .select('*')
        .eq('id', 'active')
        .single();

      if (data && data.is_active) {
        let calculatedTimeLeft = 0;
        let targetEndTime = null;

        if (data.target_end_time) {
          // Use target end time for precise calculation
          targetEndTime = new Date(data.target_end_time);
          const now = Date.now();
          calculatedTimeLeft = Math.max(0, Math.ceil((targetEndTime.getTime() - now) / 1000));
          console.log('Home: Using target end time:', data.target_end_time);
        } else {
          // Fallback to time_left
          calculatedTimeLeft = data.time_left || 0;
          console.log('Home: Using time_left (fallback)');
        }

        setGlobalTimer({
          timeLeft: calculatedTimeLeft,
          phase: data.phase || 'work',
          isActive: true,
          targetEndTime: targetEndTime,
        });
        console.log('Home: Initial sync complete - timeLeft:', calculatedTimeLeft, 'phase:', data.phase);
      } else {
        console.log('Home: No active timer found');
      }
    };

    // Fetch immediately
    fetchTimer();

    return () => {
      if (timerChannel) supabaseClient.removeChannel(timerChannel);
      clearInterval(localInterval);
    };
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
  ];


  const displayColors = activeVenue?.colors ?? setup.colors ?? DEFAULT_SETUP.colors ?? DEFAULT_BRAND_COLORS;
  const displayName = activeVenue?.name ?? setup.facilityName ?? DEFAULT_SETUP.facilityName;
  const displayLogo = activeVenue?.logo ?? setup.logo;

  return (
    <MainLayout
      title={displayName || "AVLR"}
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
        {/* Global Timer Display */}
        {globalTimer.isActive && (
          <NexusCard
            className="p-6 border-2 bg-black/40"
            style={{
              borderColor: PHASE_COLOR[globalTimer.phase],
              boxShadow: `0 0 40px ${PHASE_COLOR[globalTimer.phase]}30`,
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="text-center">
                <div className="text-xs uppercase tracking-[0.4em] mb-2" style={{ color: PHASE_COLOR[globalTimer.phase] }}>
                  Current Phase
                </div>
                <div className="heading-font text-2xl font-bold" style={{ color: PHASE_COLOR[globalTimer.phase] }}>
                  {PHASE_LABEL[globalTimer.phase]}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs uppercase tracking-[0.4em] mb-2 text-slate-400">
                  Time Remaining
                </div>
                <div className="heading-font text-4xl font-black" style={{ color: PHASE_COLOR[globalTimer.phase] }}>
                  {globalTimer.timeLeft}s
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs uppercase tracking-[0.4em] mb-2 text-slate-400">
                  Status
                </div>
                <div className="heading-font text-lg font-semibold text-slate-300">
                  Synced Across All Displays
                </div>
              </div>
            </div>
          </NexusCard>
        )}

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
            {/* Studio Selector */}
            <div className="flex justify-center mb-12">
              <div className="bg-[#121112]/50 backdrop-blur-md p-1 rounded-2xl border border-[#C8A871]/20 flex gap-2">
                {['studio-a', 'studio-b'].map((sId) => (
                  <button
                    key={sId}
                    onClick={() => {
                      storage.setActiveStudioId(sId);
                      setActiveStudio(sId);
                    }}
                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all ${
                      activeStudio === sId
                        ? 'bg-[#C8A871] text-[#121112] shadow-[0_0_20px_rgba(200,168,113,0.3)]'
                        : 'text-white/40 hover:text-white/80'
                    }`}
                  >
                    {sId === 'studio-a' ? 'Studio A' : 'Studio B'}
                  </button>
                ))}
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-[0.4em] mb-4 text-[#F1EDE5] drop-shadow-2xl">
              System Features
            </h2>
            <p className="text-[10px] md:text-sm uppercase tracking-[0.4em] text-[#C8A871] font-bold mb-16 opacity-80">
              Launch any display or control surface directly from your dashboard.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {getFeaturesForStudio(activeStudio).map((feature) => (
                <NexusCard
                  key={feature.title}
                  className="p-6 text-left bg-black/35 border-white/10 hover:border-[#C8A871]/40 hover:shadow-[0_0_32px_rgba(200,168,113,0.15)] transition cursor-pointer group"
                >
                  <a href={feature.href} className="block h-full">
                    <div className="text-[10px] uppercase tracking-[0.35em] text-[#C8A871] font-black group-hover:text-white transition-colors">
                      {feature.title}
                    </div>
                    <p className="mt-4 text-xs text-[#F1EDE5]/60 uppercase tracking-widest leading-relaxed">
                      {feature.description}
                    </p>
                  </a>
                </NexusCard>
              ))}
            </div>
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
