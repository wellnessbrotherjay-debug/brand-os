"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Clock, BarChart2, Dumbbell, Play, Info } from "lucide-react";
import { glvtTheme } from "../../config/theme";
import { useParams } from "next/navigation";
import { workoutService } from "@/lib/services/workoutService";
import { scheduleService } from "@/lib/services/scheduleService";

// Mock Detail Data (would come from workoutService.getWorkoutDetails)
const MOCK_DETAIL = {
    id: "hotel-hiit-blast",
    title: "Hotel HIIT Blast",
    description: "Explosive intervals that keep the heart rate high. Focus on maximum effort during work periods.",
    difficulty_level: "Intermediate",
    estimated_duration_min: 25,
    cover_image_url: "/class-covers/abs-blast.png",
    equipment: ["Dumbbells", "Bodyweight"],
    blocks: [
        {
            title: "Warmup",
            exercises: [
                { name: "Jumping Jacks", sets: 1, time: "60s" },
                { name: "Walking Lunges", sets: 1, time: "60s" }
            ]
        },
        {
            title: "Circuit A (3 Rounds)",
            exercises: [
                { name: "Burpees", sets: 3, reps: 15 },
                { name: "Dumbbell Thrusters", sets: 3, reps: 12 },
                { name: "Mountain Climbers", sets: 3, time: "45s" }
            ]
        },
        {
            title: "Cooldown",
            exercises: [
                { name: "Pigeon Stretch", sets: 1, time: "60s" }
            ]
        }
    ]
};

export default function WorkoutDetailPage() {
    const params = useParams();
    const [workout, setWorkout] = useState<any>(MOCK_DETAIL);

    // Real Data Fetching
    useEffect(() => {
        const load = async () => {
            if (typeof params.id === 'string') {
                const data = await workoutService.getWorkoutDetails(params.id).catch(() => null);
                if (data) setWorkout(data);
            }
        };
        load();
    }, [params.id]);

    const [isScheduling, setIsScheduling] = useState(false);

    // Booking Logic
    const handleAddToCalendar = async () => {
        // Default to today for demo
        const today = new Date().toISOString().split('T')[0];
        try {
            await scheduleService.addToSchedule("mock-user-id", today, "workout", workout.id);
            alert("Added to Today's Calendar!");
        } catch (e) {
            console.error(e);
            alert("Failed to add to calendar");
        }
    };

    return (
        <div
            className="min-h-screen pb-32 relative"
            style={{ backgroundColor: glvtTheme.colors.background.primary, color: glvtTheme.colors.text.primary }}
        >
            {/* Hero Image */}
            <div className="relative h-[45vh] w-full">
                <Image
                    src={workout.cover_image_url}
                    alt={workout.title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#0E0E0E]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0E] via-[#0E0E0E]/60 to-transparent" />

                {/* Back Button */}
                <Link
                    href="/glvt/workouts"
                    className="absolute top-6 left-6 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 z-20"
                >
                    <ChevronLeft className="w-6 h-6 text-white" />
                </Link>
            </div>

            {/* Content Container (Overlapping Hero) */}
            <div className="relative -mt-20 px-6 z-10">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded bg-[#C8A871] text-[#0E0E0E] font-bold">
                        {workout.difficulty_level}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded bg-white/10 text-white border border-white/10">
                        {workout.estimated_duration_min} MIN
                    </span>
                </div>

                <div className="flex justify-between items-end mb-4">
                    <h1
                        className="text-4xl leading-none text-white"
                        style={{ fontFamily: glvtTheme.fonts.title }}
                    >
                        {workout.title}
                    </h1>

                    <button
                        onClick={handleAddToCalendar}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-[#C8A871] backdrop-blur-md transition-all"
                    >
                        + Schedule
                    </button>
                </div>

                <p className="text-sm leading-relaxed opacity-80 mb-8" style={{ color: glvtTheme.colors.text.secondary }}>
                    {workout.description}
                </p>

                {/* Equipment */}
                <div className="flex items-center gap-3 mb-8 p-4 rounded-xl border border-white/5 bg-[#161616]">
                    <Dumbbell className="w-5 h-5 text-[#C8A871]" />
                    <div className="text-xs uppercase tracking-wider text-[#B8AEA6]">
                        {workout.equipment.join(" • ")}
                    </div>
                </div>

                {/* Workout Structure */}
                <div className="space-y-6">
                    <h3 className="text-xs uppercase tracking-[0.2em] text-[#666] font-bold">Workout Structure</h3>

                    {workout.blocks.map((block: any, idx: number) => (
                        <div key={idx} className="relative">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-6 h-6 rounded-full bg-[#1C1C1C] border border-white/10 flex items-center justify-center text-[10px] text-[#888] font-mono">
                                    {idx + 1}
                                </div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">{block.title}</h4>
                            </div>

                            <div className="pl-3 ml-3 border-l border-white/10 space-y-3">
                                {block.exercises.map((ex: any, i: number) => (
                                    <div key={i} className="bg-[#161616] p-4 rounded-lg border border-white/5 flex justify-between items-center">
                                        <span className="text-sm text-[#F1EDE5]">{ex.name}</span>
                                        <span className="text-xs text-[#C8A871] font-mono">
                                            {ex.reps ? `${ex.sets} x ${ex.reps}` : `${ex.sets} x ${ex.time}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fixed Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0E0E0E] via-[#0E0E0E] to-transparent z-30">
                <Link
                    href={`/glvt/workouts/session/${workout.id}`}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-[#C8A871] text-[#0E0E0E] text-sm uppercase tracking-[0.2em] font-bold rounded-xl shadow-[0_8px_32px_rgba(200,168,113,0.3)] transition-transform active:scale-[0.98]"
                >
                    <Play className="w-5 h-5 fill-current" />
                    Start Session
                </Link>
            </div>
        </div>
    );
}
