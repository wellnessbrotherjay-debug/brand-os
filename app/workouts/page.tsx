"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import BrandScreen from "@/components/BrandScreen";
import { useBranding } from "@/lib/hooks/useBranding";
import { workoutService } from "@/lib/services/workoutService";

// Placeholder fallback
const PLACEHOLDER_WORKOUTS = [
  {
    id: "warrior",
    slug: "skyline-warrior",
    name: "Skyline Warrior",
    description: "Signature HIIT inspired by TS Suites rooftop labs.",
    duration: 45,
    workout_type: "HIIT",
    thumbnail_url: null,
  },
];

export default function WorkoutsPage() {
  const router = useRouter();
  const { brand, ready } = useBranding();
  // Using 'any' to accommodate raw DB shape + service shape for now
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Hardcoded hotel ID for now
      const HOTEL_ID = "00000000-0000-0000-0000-000000000000";
      try {
        const data = await workoutService.getWorkouts(HOTEL_ID);
        if (!data?.length) {
          setWorkouts(PLACEHOLDER_WORKOUTS);
        } else {
          setWorkouts(data);
        }
      } catch (err) {
        console.error(err);
        setWorkouts(PLACEHOLDER_WORKOUTS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleNavigate = async (slugOrId: string) => {
    try {
      await router.push(`/workouts/${slugOrId}`);
    } catch {
      console.log("Page not found");
    }
  };

  if (!ready) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading…</div>;
  }

  return (
    <BrandScreen
      eyebrow="Workout Programs"
      title="Workouts"
      description="Station-ready programs synced with GLVT displays."
      backHref="/home"
      backLabel="Back"
    >
      {loading ? (
        <p className="text-sm text-zinc-300">Loading programs…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {workouts.map((workout) => (
            <motion.button
              key={workout.id}
              onClick={() => handleNavigate(workout.slug ?? workout.id)}
              whileHover={{ y: -4 }}
              className="rounded-3xl border border-white/10 bg-black/45 p-5 text-left shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            >
              <div className="text-xs uppercase tracking-[0.35em] text-slate-400">{workout.workout_type ?? workout.category ?? "WORKOUT"}</div>
              <p className="mt-2 text-2xl font-semibold">{workout.name ?? workout.title}</p>
              <p className="text-xs text-slate-400">{workout.duration ?? workout.duration_minutes ?? 45} min</p>
              <p className="mt-3 text-sm text-slate-300">
                {workout.description ?? "High-touch programming with cinematic cues."}
              </p>
            </motion.button>
          ))}
        </div>
      )}
    </BrandScreen>
  );
}
