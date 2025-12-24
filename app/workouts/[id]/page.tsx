"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import BrandScreen from "@/components/BrandScreen";
import { useBranding } from "@/lib/hooks/useBranding";
import { DEFAULT_WELCOME_VIDEO_URL } from "@/lib/brandConfig";
import { workoutService, type WorkoutFull } from "@/lib/services/workoutService";

const WORK_SECONDS = 45;
const REST_SECONDS = 20;

export default function WorkoutDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { brand, ready } = useBranding();
  const [workout, setWorkout] = useState<WorkoutFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"work" | "rest">("work");
  const [remaining, setRemaining] = useState(WORK_SECONDS);
  const [round, setRound] = useState(1);
  const phaseRef = useRef<"work" | "rest">("work");
  const [qrValue, setQrValue] = useState<string>("https://hotel-fit.app/mobile");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setQrValue(`${window.location.origin}/mobile?workout=${params.id}`);
  }, [params.id]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await workoutService.getWorkoutDetails(params.id);
        if (data) {
          setWorkout(data);
        } else {
          console.warn("Workout not found");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev > 1) return prev - 1;
        if (phaseRef.current === "work") {
          phaseRef.current = "rest";
          setPhase("rest");
          return REST_SECONDS;
        }
        phaseRef.current = "work";
        setPhase("work");
        setRound((value) => value + 1);
        return WORK_SECONDS;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading…</div>;
  }

  if (loading) {
    return (
      <BrandScreen eyebrow="Workout Display" title="Loading workout…" description="Preparing GLVT station view.">
        <p className="text-sm text-zinc-400">Fetching workout details…</p>
      </BrandScreen>
    );
  }

  if (!workout) {
    return (
      <BrandScreen
        eyebrow="Workout Display"
        title="Workout not found"
        description="Select another program from the list."
        backHref="/workouts"
      >
        <button onClick={() => router.push("/workouts")} className="rounded-2xl border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.35em]">
          Back to workouts
        </button>
      </BrandScreen>
    );
  }

  return (
    <BrandScreen
      eyebrow={workout.category ?? "Workout Display"}
      title={workout.title}
      description={workout.description ?? "GLVT workout experience"}
      backHref="/workouts"
    >
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-black/40">
            <video
              className="h-64 w-full object-cover opacity-60"
              src={brand.videoUrl ?? DEFAULT_WELCOME_VIDEO_URL}
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full border border-white/15 bg-black/60 px-3 py-1 text-xs uppercase tracking-[0.35em]">
                  Round {round}
                </div>
                <div className="text-sm text-slate-300">{workout.duration_minutes ?? 45} min total</div>
              </div>
              <div className="mt-4 text-5xl font-semibold">{phase === "work" ? "Work" : "Rest"}</div>
              <div className="text-3xl font-mono">{remaining.toString().padStart(2, "0")}s</div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-black/35 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Workout Structure</h2>
              <button
                onClick={() => router.push(`/workouts/${params.id}/session`)}
                className="rounded-full bg-[#34D399] px-4 py-1 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#10B981]"
              >
                Start Session
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-1">
              {workout.blocks.map((block) => (
                <div key={block.id} className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{block.title}</p>
                  <div className="space-y-2 pl-2">
                    {block.exercises?.map(we => (
                      <div key={we.id} className="flex justify-between border-l-2 border-white/10 pl-3">
                        <div>
                          <p className="font-medium text-slate-200">{we.exercise?.name}</p>
                          {we.notes && <p className="text-xs text-slate-500">{we.notes}</p>}
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          {we.target_sets} x {we.target_reps ? `${we.target_reps} reps` : `${we.target_time_sec}s`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!workout.blocks.length && <p className="text-sm text-slate-500">No exercises configured.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-black/35 p-6 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Sync to mobile</p>
            <div className="mt-4 inline-block rounded-3xl border border-white/10 bg-white/90 p-4">
              <QRCodeSVG value={qrValue} size={180} fgColor="#050505" bgColor="transparent" />
            </div>
            <p className="mt-3 text-xs text-slate-400">Scan to control stations from your phone.</p>
          </div>
        </div>
      </div>
    </BrandScreen>
  );
}
