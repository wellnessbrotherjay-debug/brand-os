"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { Search, SlidersHorizontal, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { glvtTheme } from "../config/theme";
import { FilterChip } from "../book/_components/shared";
import { WorkoutCard } from "./_components/WorkoutCard";

// Temporary fallback data (bridge until DB seeding is run)
// This matches the DB schema I wrote in 20251218_create_workout_system.sql
const FALLBACK_WORKOUTS = [
    {
        id: "hotel-hiit-blast",
        title: "Hotel HIIT Blast",
        description: "Explosive intervals that keep the heart rate high with minimal equipment.",
        category: "HIIT",
        difficulty_level: "Intermediate",
        estimated_duration_min: 25,
        cover_image_url: "/class-covers/abs-blast.png", // Reusing existing assets
        is_premium: false
    },
    {
        id: "sunrise-strength",
        title: "Sunrise Strength",
        description: "Foundational lifting pattern to start the day feeling strong.",
        category: "Strength",
        difficulty_level: "Beginner",
        estimated_duration_min: 30,
        cover_image_url: "/class-covers/glutes-workout.png",
        is_premium: false
    },
    {
        id: "mobility-flow",
        title: "Mobility Reset Flow",
        description: "Controlled mobility work to reset joints after travel.",
        category: "Mobility",
        difficulty_level: "Beginner",
        estimated_duration_min: 20,
        cover_image_url: "/class-covers/pilates-core.png",
        is_premium: false
    },
    {
        id: "glute-sculpt-db",
        title: "Glute Sculpt (Dumbbells)",
        description: "Hypertrophy-focused glute training with progressive overload.",
        category: "Strength",
        difficulty_level: "Advanced",
        estimated_duration_min: 45,
        cover_image_url: "/class-covers/glute-sculpt.png",
        is_premium: true
    },
    {
        id: "core-crusher",
        title: "Core Crusher",
        description: "Quick 15-minute core burn.",
        category: "Core",
        difficulty_level: "Intermediate",
        estimated_duration_min: 15,
        cover_image_url: "/class-covers/core-strength.png",
        is_premium: false
    }
];

const CATEGORIES = ["All", "Strength", "HIIT", "Mobility", "Core", "Cardio"];

export default function WorkoutsHomePage() {
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Filter logic
    const displayedWorkouts = FALLBACK_WORKOUTS.filter(w =>
        selectedCategory === "All" || w.category === selectedCategory
    );

    return (
        <div
            className="min-h-screen pb-24"
            style={{ backgroundColor: glvtTheme.colors.background.primary, color: glvtTheme.colors.text.primary }}
        >
            {/* Header */}
            <div className="sticky top-0 z-20 px-6 py-6 pb-2 transition-all" style={{ backgroundColor: 'rgba(14,14,14,0.95)', backdropFilter: 'blur(10px)' }}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/glvt/home">
                            <ChevronLeft className="w-6 h-6 text-[#888]" />
                        </Link>
                        <h1
                            className="text-2xl tracking-widest text-[#F1EDE5]"
                            style={{ fontFamily: glvtTheme.fonts.title }}
                        >
                            THE COLLECTION
                        </h1>
                    </div>
                    <button className="p-2 rounded-full border border-white/10 hover:bg-white/5">
                        <Search className="w-5 h-5 text-[#888]" />
                    </button>
                </div>

                {/* Filter Row */}
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 no-scrollbar">
                    {CATEGORIES.map(cat => (
                        <FilterChip
                            key={cat}
                            label={cat}
                            isActive={selectedCategory === cat}
                            onClick={() => setSelectedCategory(cat)}
                        />
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            <div className="px-6 py-2 space-y-4 animate-in fade-in duration-500 slide-in-from-bottom-4">
                {displayedWorkouts.map((workout) => (
                    <WorkoutCard
                        key={workout.id}
                        workout={workout}
                        onClick={() => {
                            console.log('Navigate to workout', workout.id);
                            // Basic navigation to session start page
                            window.location.href = `/glvt/workouts/session/${workout.id}`;
                        }}
                    />
                ))}

                {displayedWorkouts.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <p>No workouts found in this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
