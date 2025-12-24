"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, X, Clock, CheckCircle, Info, Play, Pause, ChevronRight, Save } from "lucide-react";
import Link from "next/link";
import { glvtTheme } from "../../../config/theme";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { workoutService } from "@/lib/services/workoutService";
import CloudflarePlayer from "@/components/CloudflarePlayer";

export default function WorkoutSessionPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [loading, setLoading] = useState(true);
    const [workout, setWorkout] = useState<any>(null);
    const [exercises, setExercises] = useState<any[]>([]);

    // State for active exercise
    const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(true);

    // Logging State: Map of exerciseId -> [ { weight, reps, completed } ]
    // For simplicity in this stage, we'll store logs in a local state and save on "Complete Set" or "Finish"
    const [logs, setLogs] = useState<Record<string, any[]>>({});

    useEffect(() => {
        // Load Data
        const loadSessionData = async () => {
            // In a real app, we'd fetch the existing session by ID or create a new one if it's a "start" action.
            // For this "Fix" scope, we assume `sessionId` passed might be a `workoutId` if we are starting new, 
            // or a `sessionId` if resuming.
            // To keep it simple: We will assume the ID passed is the WORKOUT ID to start a NEW session (as per Home/Diary links).
            // In a full prod app, we'd handle the distinction.

            try {
                // 1. Fetch Workout Details
                // We'll treat the URL param as workoutId for now to Start Fresh
                const workoutId = sessionId;
                const data = await workoutService.getWorkoutDetails(workoutId).catch(() => null);

                if (data) {
                    setWorkout(data);
                    setExercises(data.exercises || []);

                    // Initialize Logs State
                    const initialLogs: Record<string, any[]> = {};
                    data.exercises?.forEach((ex: any) => {
                        const setList = [];
                        for (let i = 0; i < (ex.sets || 3); i++) {
                            setList.push({ weight: "", reps: "", completed: false });
                        }
                        initialLogs[ex.id] = setList;
                    });
                    setLogs(initialLogs);
                } else {
                    // Fallback Mock if service fails (or no DB data yet)
                    console.warn("Using fallback mock data");
                    setWorkout({ title: "Fallback Workout" });
                    setExercises([
                        {
                            id: "ex-1",
                            exercise_library: { exercise_name: "Pushups", thumbnail_url: null },
                            sets: 3,
                            reps_target: "12",
                            notes: "Keep back straight"
                        }
                    ]);
                    setLogs({ "ex-1": [{}, {}, {}] });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadSessionData();
    }, [sessionId]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning) {
            interval = setInterval(() => setTimer(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const toggleSetComplete = async (exerciseId: string, setIndex: number) => {
        const newLogs = { ...logs };
        const currentSet = newLogs[exerciseId][setIndex];
        currentSet.completed = !currentSet.completed;
        setLogs(newLogs);

        // If completing, save to DB (Fire and forget provided service works)
        if (currentSet.completed) {
            // Mock session ID for logs since we haven't officially "created" a session record in this view flow yet to keep it snappy.
            // In real impl, we'd ensure session exists first.
            await workoutService.logSet("temp-session-id", exerciseId, setIndex + 1, Number(currentSet.weight), Number(currentSet.reps));
        }
    };

    const handleInputChange = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
        const newLogs = { ...logs };
        newLogs[exerciseId][setIndex][field] = value;
        setLogs(newLogs);
    }

    const finishWorkout = () => {
        // Complete logic
        router.push('/glvt/home'); // or summary page
    }

    if (loading) return <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center text-[#C8A871]">Loading...</div>;

    const currentBx = exercises[activeExerciseIndex];
    if (!currentBx) return <div className="text-white">No exercises found.</div>;

    return (
        <div className="min-h-screen bg-[#0E0E0E] text-[#F1EDE5] flex flex-col font-sans">
            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#161616]">
                <Link href="/glvt/home" className="p-2">
                    <X className="w-5 h-5 text-[#888]" />
                </Link>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#666]">Duration</span>
                    <span className="text-lg font-mono font-bold text-[#C8A871]">{formatTime(timer)}</span>
                </div>
                <button className="p-2">
                    <Info className="w-5 h-5 text-[#888]" />
                </button>
            </div>

            {/* Main Exercise Area - Video or Image */}
            <div className="relative h-[35vh] w-full bg-[#111]">
                {currentBx.exercise_library?.video_url ? (
                    <div className="relative w-full h-full">
                        <CloudflarePlayer
                            videoId={currentBx.exercise_library.video_url}
                            autoPlay={true}
                            controls={true}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : currentBx.exercise_library?.thumbnail_url ? (
                    <Image
                        src={currentBx.exercise_library.thumbnail_url}
                        alt={currentBx.exercise_library.exercise_name}
                        fill
                        className="object-cover opacity-60"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#333] font-bold text-4xl">
                        GLVT
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0E0E0E] via-[#0E0E0E]/80 to-transparent pointer-events-none">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-[#C8A871] text-[#0E0E0E] text-[10px] uppercase font-bold tracking-wider">
                            Ex {activeExerciseIndex + 1}/{exercises.length}
                        </span>
                    </div>
                    <h2 className="text-3xl font-serif text-white">{currentBx.exercise_library?.exercise_name || "Exercise"}</h2>
                    {currentBx.exercise_library?.instructions && (
                        <p className="text-xs text-[#D7D5D2] mt-2 max-w-md line-clamp-2">
                            {currentBx.exercise_library.instructions}
                        </p>
                    )}
                    <p className="text-sm text-[#C8A871] mt-1 font-mono">Target: {currentBx.reps_target || "12"} reps</p>
                </div>
            </div>

            {/* Logging Area */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-[#666] mb-2 px-2">
                    <span>Set</span>
                    <span>Kg</span>
                    <span>Reps</span>
                    <span>Done</span>
                </div>

                {logs[currentBx.id]?.map((set: any, idx: number) => (
                    <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${set.completed ? 'bg-[#C8A871]/10 border-[#C8A871]/30' : 'bg-[#161616] border-white/5'}`}
                    >
                        <div className="w-8 h-8 rounded-full bg-[#242424] flex items-center justify-center text-xs font-bold text-[#888]">
                            {idx + 1}
                        </div>

                        <input
                            type="number"
                            placeholder="-"
                            value={set.weight}
                            onChange={(e) => handleInputChange(currentBx.id, idx, 'weight', e.target.value)}
                            className="w-16 bg-transparent text-center text-lg font-bold border-b border-white/10 focus:border-[#C8A871] outline-none rounded-none py-1"
                        />

                        <input
                            type="number"
                            placeholder="-"
                            value={set.reps}
                            onChange={(e) => handleInputChange(currentBx.id, idx, 'reps', e.target.value)}
                            className="w-16 bg-transparent text-center text-lg font-bold border-b border-white/10 focus:border-[#C8A871] outline-none rounded-none py-1"
                        />

                        <button
                            onClick={() => toggleSetComplete(currentBx.id, idx)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${set.completed ? 'bg-[#C8A871] text-[#0E0E0E]' : 'bg-[#242424] text-[#444]'}`}
                        >
                            <CheckCircle className="w-6 h-6" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="p-6 bg-[#161616] border-t border-white/5 pb-10">
                <div className="flex gap-4">
                    <button
                        disabled={activeExerciseIndex === 0}
                        onClick={() => setActiveExerciseIndex(prev => prev - 1)}
                        className="flex-1 py-4 rounded-xl border border-white/10 bg-[#242424] text-[#D7D5D2] font-bold uppercase tracking-widest text-xs hover:bg-[#2D2D2D] disabled:opacity-50"
                    >
                        Previous
                    </button>

                    {activeExerciseIndex < exercises.length - 1 ? (
                        <button
                            onClick={() => setActiveExerciseIndex(prev => prev + 1)}
                            className="flex-[2] py-4 rounded-xl bg-[#C8A871] text-[#0E0E0E] font-bold uppercase tracking-widest text-xs shadow-[0_4px_20px_rgba(200,168,113,0.3)] hover:bg-[#d4b57a] flex items-center justify-center gap-2"
                        >
                            Next Exercise <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={finishWorkout}
                            className="flex-[2] py-4 rounded-xl bg-[#F1EDE5] text-[#0E0E0E] font-bold uppercase tracking-widest text-xs shadow-[0_4px_20px_rgba(255,255,255,0.3)] hover:bg-white flex items-center justify-center gap-2"
                        >
                            Finish Workout <Save className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
