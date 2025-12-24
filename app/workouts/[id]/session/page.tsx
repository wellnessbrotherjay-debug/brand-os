"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import BrandScreen from "@/components/BrandScreen";
import { useBranding } from "@/lib/hooks/useBranding";
import { workoutService, type WorkoutFull } from "@/lib/services/workoutService";
import { supabase } from "@/lib/supabase"; // For auth user check

export default function WorkoutSessionPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { brand, ready } = useBranding();
    const [workout, setWorkout] = useState<WorkoutFull | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Track inputs: { [exerciseId_setNumber]: { weight, reps } }
    const [logs, setLogs] = useState<Record<string, { weight: string, reps: string }>>({});

    useEffect(() => {
        const init = async () => {
            try {
                // 1. Get Workout
                const wData = await workoutService.getWorkoutDetails(params.id);
                if (!wData) {
                    toast.error("Workout not found");
                    router.push("/workouts");
                    return;
                }
                setWorkout(wData);

                // 2. Start Session (Mock User ID for now if not auth)
                // In real app: const { data: { user } } = await supabase.auth.getUser();
                const userId = "00000000-0000-0000-0000-000000000000";
                // We need a valid UUID for the mock to work if RLS is strict, or we disable RLS.
                // For this demo let's assume valid session creation or handle error gracefully.
                try {
                    // const session = await workoutService.startSession(userId, wData.hotel_id, wData.id);
                    // setSessionId(session.id);
                    console.log("Session started (mock)");
                    setSessionId("mock-session-id");
                } catch (e) {
                    console.error("Failed to start session", e);
                    toast.error("Could not start tracking");
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [params.id]);

    const handleLogChange = (exerciseId: string, setNum: number, field: 'weight' | 'reps', value: string) => {
        const key = `${exerciseId}_${setNum}`;
        setLogs(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
    };

    const saveSet = async (blockId: string, exerciseId: string, setNum: number) => {
        if (!sessionId) return;
        const key = `${exerciseId}_${setNum}`;
        const entry = logs[key];
        if (!entry) return;

        try {
            await workoutService.logSet(sessionId, blockId, exerciseId, setNum, {
                weight_kg: parseFloat(entry.weight),
                reps_completed: parseInt(entry.reps)
            });
            toast.success(`Set ${setNum} saved`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to save set");
        }
    };

    const finishWorkout = async () => {
        if (sessionId) {
            await workoutService.completeSession(sessionId, { notes: "Completed via GLVT Web" });
        }
        toast.success("Workout Complete!");
        router.push("/workouts");
    };

    if (!ready || loading) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Preparing Session...</div>;
    }

    if (!workout) return null;

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-4 py-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <h1 className="truncate text-lg font-bold">{workout.title}</h1>
                    <button
                        onClick={finishWorkout}
                        className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500"
                    >
                        Finish
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6 max-w-2xl mx-auto">
                {workout.blocks.map(block => (
                    <div key={block.id} className="space-y-4">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{block.title}</h2>
                        {block.exercises?.map(we => (
                            <div key={we.id} className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
                                <h3 className="font-semibold text-lg">{we.exercise?.name}</h3>
                                {we.notes && <p className="text-sm text-zinc-400 mb-4">{we.notes}</p>}

                                <div className="space-y-2">
                                    {/* Header Row */}
                                    <div className="grid grid-cols-[40px,1fr,1fr,40px] gap-2 text-center text-xs text-zinc-500 uppercase tracking-wider">
                                        <span>Set</span>
                                        <span>kg</span>
                                        <span>Reps</span>
                                        <span>✓</span>
                                    </div>

                                    {/* Sets */}
                                    {Array.from({ length: we.target_sets }).map((_, i) => {
                                        const setNum = i + 1;
                                        const key = `${we.id}_${setNum}`;
                                        const val = logs[key] || { weight: '', reps: '' };

                                        return (
                                            <div key={setNum} className="grid grid-cols-[40px,1fr,1fr,40px] gap-2 items-center">
                                                <div className="text-center font-mono text-zinc-400">{setNum}</div>
                                                <input
                                                    type="number"
                                                    placeholder="-"
                                                    className="w-full rounded-lg bg-black border border-white/20 p-2 text-center font-mono focus:border-blue-500 focus:outline-none"
                                                    value={val.weight}
                                                    onChange={(e) => handleLogChange(we.id, setNum, 'weight', e.target.value)}
                                                />
                                                <input
                                                    type="number"
                                                    placeholder={we.target_reps?.toString() || "-"}
                                                    className="w-full rounded-lg bg-black border border-white/20 p-2 text-center font-mono focus:border-blue-500 focus:outline-none"
                                                    value={val.reps}
                                                    onChange={(e) => handleLogChange(we.id, setNum, 'reps', e.target.value)}
                                                />
                                                <button
                                                    onClick={() => saveSet(block.id, we.exercise_id, setNum)}
                                                    className="flex h-full w-full items-center justify-center rounded-lg bg-emerald-900/50 text-emerald-500 hover:bg-emerald-900"
                                                >
                                                    ✔
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
