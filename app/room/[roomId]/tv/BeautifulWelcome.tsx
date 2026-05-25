"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const DEFAULT_PROFILE = {
  guestName: "Valued Guest",
  roomNumber: "101",
  wifiLabel: "Connected · 150 Mbps",
  temperature: "26°C",
  city: "Seminyak",
  weather: "Clear skies",
};

export default function RoomWelcomeBeautiful() {
  const router = useRouter();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [timeLabel, setTimeLabel] = useState("");

  useEffect(() => {
    const updateClock = () => {
      setTimeLabel(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-white font-sans">
      <Image src="/hotel-bg.jpg" alt="Hotel background" fill sizes="100vw" className="object-cover opacity-40" unoptimized />
      <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/65 to-black/35" />
      <div className="relative z-10 flex min-h-screen flex-col px-6 py-10 lg:px-14">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="text-xs uppercase tracking-[0.5em] text-white/60">AVLR COLLECTION</div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-4 py-2 backdrop-blur">
              <span className="font-bold">Room</span>
              <span>{profile.roomNumber}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-4 py-2 backdrop-blur">
              <span className="font-bold">{profile.city}</span>
              <span>{profile.weather} · {profile.temperature}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-4 py-2 backdrop-blur">
              <span className="font-bold">Wi-Fi</span>
              <span>{profile.wifiLabel}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-4 py-2 backdrop-blur">
              <span className="font-bold">Local Time</span>
              <span>{timeLabel}</span>
            </div>
          </div>
        </header>
        <section className="mt-14 flex flex-col gap-10 lg:flex-row lg:items-center">
          <div className="flex items-center gap-8">
            <div className="h-28 w-28 rounded-full border border-white/20 bg-white/5 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur">
              <Image
                src="/logos/global-avrl-logo.png"
                alt="Hotel logo"
                width={112}
                height={112}
                className="h-full w-full object-contain"
                unoptimized
              />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-white/70">Hello</p>
              <h1 className="text-4xl font-semibold tracking-wide text-white md:text-5xl">{profile.guestName}</h1>
              <p className="mt-3 text-lg text-white/80">Welcome to your suite. Your personalized hotel TV is ready.</p>
              <p className="text-sm text-white/60 mt-2">AVLR Hotel Fit Solutions</p>
            </div>
          </div>
          <div className="flex flex-col gap-6 items-end">
            <button
              onClick={() => router.push(`/room/101/tv/dashboard`)}
              className="rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-8 py-4 text-lg font-bold text-slate-900 shadow-lg hover:scale-105 transition"
            >
              Enter TV Dashboard →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
