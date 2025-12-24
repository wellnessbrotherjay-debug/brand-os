"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useBranding } from "@/lib/hooks/useBranding";
import { ensureGuestSession } from "@/lib/utils/guestSession";
import { useGreetingClock } from "@/lib/hooks/useGreetingClock";
import { systemFeatures } from "@/lib/system-features";
import {
  DEFAULT_ROOM_WORKOUTS,
  loadRoomWorkoutLibrary,
  type RoomWorkoutCategory,
  type RoomWorkoutEntry,
  ROOM_WORKOUT_CATEGORIES,
} from "@/lib/room-workout-library";

type IconProps = {
  className?: string;
};

const TvIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M8 20h8" strokeLinecap="round" />
  </svg>
);

const GlobeIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.5 3 2.5 15 0 18" />
  </svg>
);

const UmbrellaIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path d="M3 12a9 9 0 0 1 18 0Z" />
    <path d="M12 12v6a3 3 0 0 0 6 0" strokeLinecap="round" />
  </svg>
);

const BellIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path d="M6 16v-4a6 6 0 1 1 12 0v4" />
    <path d="M4 16h16" strokeLinecap="round" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);

const MapPinIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path d="M12 21s-6-5.33-6-10a6 6 0 0 1 12 0c0 4.67-6 10-6 10Z" />
    <circle cx="12" cy="11" r="2.5" />
  </svg>
);

const UserIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M6 20c0-3.31 2.69-6 6-6s6 2.69 6 6" strokeLinecap="round" />
  </svg>
);

const PlayIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path d="M8 6v12l8-6Z" strokeLinejoin="round" />
  </svg>
);

const WifiIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path d="M5 8.55a12 12 0 0 1 14 0" strokeLinecap="round" />
    <path d="M8.5 12.05a7 7 0 0 1 7 0" strokeLinecap="round" />
    <path d="M12 17h.01" strokeLinecap="round" />
  </svg>
);

const ThermometerIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0Z" />
  </svg>
);

const ClockIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" strokeLinecap="round" />
  </svg>
);

const RoomKeyIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <circle cx="8" cy="15" r="4" />
    <path d="M12 15h9l-2 2 2 2h-3l-2 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DumbbellIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path d="M4 9v6M20 9v6" strokeLinecap="round" />
    <path d="M7 5v14M17 5v14" />
    <path d="M7 12h10" strokeLinecap="round" />
  </svg>
);

const UtensilsIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path d="M6 3v8" />
    <path d="M4 3v8" />
    <path d="M8 3v8" />
    <path d="M5 11v10" strokeLinecap="round" />
    <path d="M15 3c1.66 0 3 1.34 3 3 0 1.04-.53 1.96-1.34 2.5.24 1.93.34 2.75.34 4.5v6" strokeLinecap="round" />
  </svg>
);

const SpaIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path d="M12 6c-5 0-6 7-6 7s3-1 6-1 6 1 6 1-1-7-6-7Z" />
    <path d="M8 15s1 3 4 3 4-3 4-3" strokeLinecap="round" />
  </svg>
);

const ConciergeIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <circle cx="12" cy="7" r="3" />
    <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
  </svg>
);

const TutorialIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <path d="M4 12h16" />
    <path d="M10 9h4M10 15h4" strokeLinecap="round" />
  </svg>
);

const PROFILE_STORAGE_KEY = "hotel_fit_welcome_profile";

type WelcomeProfile = {
  guestName: string;
  roomNumber: string;
  wifiLabel: string;
  temperature: string;
  city: string;
  weather: string;
};

const DEFAULT_PROFILE: WelcomeProfile = {
  guestName: "John Thorton",
  roomNumber: "504",
  wifiLabel: "Connected · 150 Mbps",
  temperature: "26°C",
  city: "Seminyak",
  weather: "Clear skies",
};

export default function WelcomePage() {
  const router = useRouter();
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [profile, setProfile] = useState<WelcomeProfile>(DEFAULT_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [draftProfile, setDraftProfile] = useState<WelcomeProfile>(DEFAULT_PROFILE);
  const { brand, ready } = useBranding();
  const { timeLabel, greeting } = useGreetingClock();
  const [roomWorkouts, setRoomWorkouts] = useState<RoomWorkoutEntry[]>(DEFAULT_ROOM_WORKOUTS);
  const [activeWorkoutCategory, setActiveWorkoutCategory] = useState<RoomWorkoutCategory>(
    ROOM_WORKOUT_CATEGORIES[0],
  );
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>(
    DEFAULT_ROOM_WORKOUTS[0]?.id ?? "",
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = loadRoomWorkoutLibrary();
    setRoomWorkouts(stored);
    setSelectedWorkoutId((prev) => {
      if (stored.some((entry) => entry.id === prev)) return prev;
      return stored[0]?.id ?? DEFAULT_ROOM_WORKOUTS[0]?.id ?? "";
    });
  }, []);
  useEffect(() => {
    if (!roomWorkouts.length) return;
    if (!roomWorkouts.some((entry) => entry.id === selectedWorkoutId)) {
      setSelectedWorkoutId(roomWorkouts[0].id);
    }
  }, [roomWorkouts, selectedWorkoutId]);
  const filteredWorkouts = useMemo(
    () => roomWorkouts.filter((item) => item.category === activeWorkoutCategory),
    [roomWorkouts, activeWorkoutCategory],
  );
  const selectedWorkout =
    roomWorkouts.find((item) => item.id === selectedWorkoutId) ?? filteredWorkouts[0] ?? roomWorkouts[0];

  useEffect(() => {
    const storedProfile = typeof window !== "undefined" ? window.localStorage.getItem(PROFILE_STORAGE_KEY) : null;
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile) as WelcomeProfile;
        setProfile(parsed);
      } catch {
        // ignore corrupted storage
      }
    }

    ensureGuestSession()
      .then((id) => {
        if (id) setGuestSessionId(id);
      })
      .catch((err) => {
        console.warn("Failed to ensure guest session", err);
      });
  }, []);

  useEffect(() => {
    if (isEditing) {
      setDraftProfile(profile);
    }
  }, [isEditing, profile]);

  const persistProfile = (next: WelcomeProfile) => {
    setProfile(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
    }
  };

  const handleNavigate = async (href: string) => {
    try {
      await router.push(href);
    } catch {
      console.log("Page not found");
    }
  };

  const handleShowWorkout = () => {
    if (!selectedWorkout) return;
    handleNavigate(
      `/tv/workout?source=hotel&highlight=${encodeURIComponent(selectedWorkout.id)}`,
    );
  };

  const statusChips = useMemo(
    () => [
      {
        label: "Room",
        value: `Room ${profile.roomNumber}`,
        icon: RoomKeyIcon,
      },
      {
        label: profile.city,
        value: `${profile.weather} · ${profile.temperature}`,
        icon: ThermometerIcon,
      },
      {
        label: "Wi-Fi",
        value: profile.wifiLabel,
        icon: WifiIcon,
      },
      {
        label: "Local Time",
        value: timeLabel,
        icon: ClockIcon,
      },
    ],
    [profile, timeLabel],
  );

  const mainActions = [
    {
      label: "TV & Casting",
      description: "Live channels, workouts and mirroring",
      href: "/display-tv",
      icon: TvIcon,
    },
    {
      label: "Internet",
      description: "Wi-Fi details & premium bandwidth",
      href: "/internet",
      icon: GlobeIcon,
    },
    {
      label: "Room Workouts",
      description: "In-room training, stretch, meditation, and relax kits",
      href: "/room-workout/builder",
      icon: UmbrellaIcon,
    },
    {
      label: "Hotel Services",
      description: "Concierge, housekeeping, transport",
      href: "/services",
      icon: BellIcon,
    },
  ];

  const conciergeTiles = [
    {
      label: "Fitness Workouts",
      description: "Tailored sessions & room programs",
      href: "/room-workout/builder",
      icon: DumbbellIcon,
    },
    { label: "Order Wellness Food", description: "Trainer-approved meals & juices", href: "/meal-order", icon: UtensilsIcon },
    { label: "Spa & Recovery", description: "Massages, cryo, IV drips", href: "/beach-wellness", icon: SpaIcon },
    { label: "Concierge Chat", description: "Message the butler or front desk", href: "/concierge", icon: ConciergeIcon },
  ];

  const ribbonLinks = [
    { label: "TV", href: "/display-tv", icon: TvIcon },
    { label: "Internet", href: "/internet", icon: GlobeIcon },
    { label: "Beach & Wellness", href: "/beach-wellness", icon: UmbrellaIcon },
    { label: "Service", href: "/services", icon: BellIcon },
    { label: "Guide", href: "/guide", icon: MapPinIcon },
    { label: "Profile", href: "/profile", icon: UserIcon },
    { label: "Tutorial", href: "/tutorial", icon: PlayIcon },
  ];

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        Preparing your suite…
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-white" style={{ fontFamily: brand.font }}>
      {brand.videoUrl ? (
        <video className="absolute inset-0 h-full w-full object-cover opacity-40" src={brand.videoUrl} autoPlay loop muted playsInline />
      ) : (
        <img src={brand.backgroundUrl} alt="Hotel background" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/65 to-black/35"
        style={{ backgroundImage: brand.videoUrl ? undefined : `url(${brand.backgroundUrl})`, backgroundSize: "cover" }}
      />

      <div className="relative z-10 flex min-h-screen flex-col px-6 py-10 lg:px-14">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="text-xs uppercase tracking-[0.5em] text-white/60">HOTEL FIT COLLECTION</div>
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/80 transition hover:border-white/60"
            >
              Edit
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
            {statusChips.map((chip) => (
              <div
                key={chip.label}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-4 py-2 backdrop-blur"
              >
                <chip.icon className="h-4 w-4" />
                <div>
                  <p className="text-[0.6rem] uppercase tracking-[0.3em] text-white/50">{chip.label}</p>
                  <p className="text-sm font-semibold text-white">{chip.value}</p>
                </div>
              </div>
            ))}
          </div>
        </header>

        <section className="mt-14 flex flex-col gap-10 lg:flex-row lg:items-center">
          <div className="flex items-center gap-8">
            <div className="h-28 w-28 rounded-full border border-white/20 bg-white/5 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur">
              <img
                src={brand.logoUrl}
                alt={`${brand.name} logo`}
                className="h-full w-full object-contain"
                onError={(event) => {
                  (event.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-white/70">Hello</p>
              <h1 className="text-4xl font-semibold tracking-wide text-white md:text-5xl">{profile.guestName}</h1>
              <p className="mt-3 text-lg text-white/80">What would you like to do today?</p>
              <p className="text-sm text-white/60">
                Session {guestSessionId ?? "initializing"} · {brand.name}
              </p>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
            {conciergeTiles.map((card) => (
              <motion.button
                key={card.label}
                whileHover={{ y: -4, boxShadow: "0 25px 60px rgba(0,0,0,0.45)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleNavigate(card.href)}
                className="rounded-3xl border border-white/15 bg-white/5 p-5 text-left backdrop-blur"
              >
                <card.icon className="mb-4 h-7 w-7 text-white" />
                <div className="text-xl font-semibold">{card.label}</div>
                <p className="mt-2 text-sm text-white/75">{card.description}</p>
              </motion.button>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {mainActions.map((action) => (
            <motion.button
              key={action.label}
              onClick={() => handleNavigate(action.href)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col rounded-[28px] border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 text-left shadow-[0_25px_80px_rgba(0,0,0,0.5)] backdrop-blur"
            >
              <action.icon className="h-8 w-8 text-white" />
              <div className="mt-4 text-2xl font-semibold">{action.label}</div>
              <p className="mt-2 text-sm text-white/70">{action.description}</p>
            </motion.button>
          ))}
        </section>

        <section className="mt-12 space-y-6 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Room workout studio</p>
              <h2 className="text-3xl font-semibold text-white">Hotel routine collection</h2>
              <p className="text-sm text-white/70">
                Pick a category, browse curated routines, and send the best one straight to the welcome TV.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ROOM_WORKOUT_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveWorkoutCategory(category)}
                  className={`rounded-full border px-4 py-1 text-xs uppercase tracking-[0.3em] transition ${activeWorkoutCategory === category
                      ? "border-emerald-400 bg-emerald-600/20 text-emerald-200"
                      : "border-white/20 text-slate-200 hover:border-emerald-300/60"
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {filteredWorkouts.map((workout) => (
              <button
                key={workout.id}
                type="button"
                onClick={() => setSelectedWorkoutId(workout.id)}
                className={`flex flex-col gap-3 rounded-3xl border p-5 text-left transition ${selectedWorkoutId === workout.id
                    ? "border-sky-400 bg-sky-500/10"
                    : "border-white/10 bg-white/5 hover:border-sky-400/40"
                  }`}
              >
                <span className="text-xs uppercase tracking-[0.4em] text-slate-300">{workout.category}</span>
                <h3 className="text-xl font-semibold text-white">{workout.title}</h3>
                <p className="text-sm text-white/70">{workout.description}</p>
                <span className="text-xs uppercase tracking-[0.3em] text-emerald-300">
                  Duration · {workout.duration}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 to-slate-950/90 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Selected show</p>
              <h3 className="text-2xl font-semibold text-white">{selectedWorkout?.title}</h3>
              <p className="mt-1 text-sm text-white/70">{selectedWorkout?.description}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.3em] text-white/50">
                Duration: {selectedWorkout?.duration}
              </p>
            </div>
            <button
              type="button"
              onClick={handleShowWorkout}
              className="rounded-full border border-sky-400 px-6 py-3 text-xs uppercase tracking-[0.4em] text-sky-100 transition hover:bg-sky-400/20"
            >
              Show on TV
            </button>
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.5em] text-slate-400">System features</p>
            <h2 className="text-3xl font-semibold text-white">Hotel display access</h2>
            <p className="text-sm text-slate-400">
              Launch any display or control surface directly from the welcome hub.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {systemFeatures.map((feature) => (
              <button
                key={feature.title}
                type="button"
                onClick={() => handleNavigate(feature.href)}
                className="flex flex-col gap-3 rounded-3xl border border-white/15 bg-white/5 p-5 text-left transition hover:border-sky-400/50 hover:bg-sky-500/10"
              >
                <div className="text-xs uppercase tracking-[0.35em] text-slate-400">{feature.title}</div>
                <p className="text-sm text-white/70">{feature.description}</p>
              </button>
            ))}
          </div>
        </section>

        <nav className="mt-auto w-full">
          <div className="mb-3 text-xs uppercase tracking-[0.5em] text-white/70">{greeting}</div>
          <div className="grid gap-3 rounded-3xl border border-white/15 bg-black/30 p-4 backdrop-blur-xl sm:grid-cols-3 lg:grid-cols-7">
            {ribbonLinks.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigate(item.href)}
                className="flex flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center text-white/80 transition hover:bg-white/10"
              >
                <item.icon className="h-7 w-7 text-white" />
                <span className="text-sm font-semibold">{item.label}</span>
              </button>
            ))}
          </div>
          <footer className="mt-6 text-center text-sm text-white/70">
            Powered by <span className="font-semibold text-white">Hotel Fit Solutionss™</span>
          </footer>
        </nav>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <ProfileForm
            draft={draftProfile}
            onClose={() => setIsEditing(false)}
            onChange={(next) => setDraftProfile(next)}
            onSubmit={(event) => {
              event.preventDefault();
              persistProfile(draftProfile);
              setIsEditing(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function ProfileForm({
  draft,
  onClose,
  onChange,
  onSubmit,
}: {
  draft: WelcomeProfile;
  onClose: () => void;
  onChange: (next: WelcomeProfile) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const update = (field: keyof WelcomeProfile, value: string) => {
    onChange({ ...draft, [field]: value });
  };

  return (
    <form onSubmit={onSubmit} className="w-full max-w-lg rounded-3xl bg-white/95 p-6 text-black shadow-2xl">
      <h2 className="text-2xl font-semibold text-gray-900">Customize welcome info</h2>
      <p className="text-sm text-gray-500">Personalize what appears on the guest screen.</p>
      <div className="mt-4 grid gap-4">
        {(
          [
            { label: "Guest name", field: "guestName" },
            { label: "Room number", field: "roomNumber" },
            { label: "Wi-Fi label", field: "wifiLabel" },
            { label: "Temperature", field: "temperature" },
            { label: "City / area", field: "city" },
            { label: "Weather summary", field: "weather" },
          ] as Array<{ label: string; field: keyof WelcomeProfile }>
        ).map((input) => (
          <label key={input.field} className="text-sm font-medium text-gray-700">
            {input.label}
            <input
              type="text"
              value={draft[input.field]}
              onChange={(event) => update(input.field, event.target.value)}
              className="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-2 text-base text-gray-900 focus:border-black focus:outline-none"
            />
          </label>
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
        >
          Cancel
        </button>
        <button type="submit" className="rounded-2xl bg-black px-5 py-2 text-sm font-semibold text-white">
          Save
        </button>
      </div>
    </form>
  );
}
