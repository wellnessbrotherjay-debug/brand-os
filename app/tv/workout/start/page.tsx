"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { storage } from "@/lib/workout-engine/storage";

export default function TvWorkoutStartPage() {
  const [message, setMessage] = useState("Preparing workout session...");

  useEffect(() => {
    try {
      const setup = storage.getSetup();
      if (!setup) {
        setMessage("No workout setup found on this device. Load a plan first.");
        return;
      }

      storage.startSession(setup);
      setMessage("Workout session started! Switch back to the TV display.");
    } catch (error) {
      console.error("Failed to start session from QR trigger", error);
      setMessage("Unable to start session. Please start from the builder.");
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-6 text-center">
      <h1 className="mb-4 text-3xl font-bold uppercase tracking-[0.3em] text-[#00BFFF]">
        Workout Trigger
      </h1>
      <p className="max-w-md text-sm text-white/80">{message}</p>
      <Link
        href="/tv/workout"
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-2 text-sm uppercase tracking-[0.2em] text-white/70 hover:border-white/50 hover:text-white"
      >
        Go to TV Workout
      </Link>
    </main>
  );
}
