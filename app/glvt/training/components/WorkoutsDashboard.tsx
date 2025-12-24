"use client";

import { useState } from "react";
import { Play, ArrowLeft, Timer, Activity, ChevronRight, BarChart, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

// LEVEL 1: TRAINING CATEGORIES (Female Focused)
const CATEGORIES = [
    {
        id: "sculpt",
        title: "SCULPT & SHAPE",
        subtitle: "Hypertrophy & Aesthetics",
        image: "/class-covers/glute-sculpt.png",
        description: "Targeted resistance training to build curves and definition. Focus on glutes, shoulders, and core.",
    },
    {
        id: "strength",
        title: "CORE & POWER",
        subtitle: "Functional Strength",
        image: "/class-covers/lower-body-power.png",
        description: "Build a strong, resilient body. Compound movements designed for female physiology to enhance power without bulk.",
    },
    {
        id: "burn",
        title: "LEAN & BURN",
        subtitle: "High Intensity Cardio",
        image: "/class-covers/abs-blast.png",
        description: "Maximize calorie burn and strip body fat with high-energy interval sessions. Sweat with style.",
    },
    {
        id: "flow",
        title: "PILATES FLOW",
        subtitle: "Mobility & Tone",
        image: "/class-covers/pilates-core.png",
        description: "Lengthen, strengthen, and align. Mat pilates and yoga fusion for posture and deep core connection.",
    }
];

// LEVEL 2: PROGRAMS WITHIN CATEGORIES (Easy / Medium / Advanced)
const PROGRAMS_DATA: Record<string, any[]> = {
    "sculpt": [
        {
            id: "sculpt-1",
            title: "Foundation Curves",
            level: "Beginner",
            image: "/class-covers/glutes-workout.png",
            description: "The perfect starting point for muscle tone. Master the basics of glute bridges, squats, and upper body shaping.",
            features: ["Low Impact", "Glute Activation", "Form Focus"]
        },
        {
            id: "sculpt-2",
            title: "Hourglass Definition",
            level: "Intermediate",
            image: "/class-covers/glute-sculpt.png",
            description: "Increase volume and intensity to carve out an hourglass figure. Higher reps and supersets.",
            features: ["Volume Training", "Shoulder Cap Focus", "Glute Isolation"]
        },
        {
            id: "sculpt-3",
            title: "Pro Contour",
            level: "Advanced",
            image: "/class-covers/lower-body-power.png",
            description: "Elite level aesthetics training. Advanced techniques like drop sets and time-under-tension for maximum definition.",
            features: ["Advanced Hypertrophy", "Detailed Splits", "Peak Conditioning"]
        }
    ],
    "strength": [
        {
            id: "strength-1",
            title: "Bodyweight Basics",
            level: "Beginner",
            image: "/class-covers/core-strength.png",
            description: "Master your own bodyweight. Pushups, lunges, and plank variations to build a solid base.",
            features: ["No Equipment", "Core Stability", "Full Body"]
        },
        {
            id: "strength-2",
            title: "Functional Strength",
            level: "Intermediate",
            image: "/class-covers/lower-body-power.png",
            description: "Introduce weights to build functional power. Kettlebells and dumbbells for real-world strength.",
            features: ["Kettlebell Flows", "Weighted Lunges", "Dynamic Power"]
        },
        {
            id: "strength-3",
            title: "Power Athlete",
            level: "Advanced",
            image: "/class-covers/glutes-workout.png",
            description: "High-performance strength training. Olympic lifting variations and heavy compounds for peak power.",
            features: ["Barbell Work", "Explosive Power", "Athletic Prep"]
        }
    ],
    "burn": [
        {
            id: "burn-1",
            title: "Cardio Kickstart",
            level: "Beginner",
            image: "/class-covers/abs-blast.png",
            description: "Low-impact intervals to build cardiovascular endurance without joint stress.",
            features: ["Low Impact HIIT", "Steady State", "Heart Health"]
        },
        {
            id: "burn-2",
            title: "Metabolic Fire",
            level: "Intermediate",
            image: "/class-covers/abs-blast.png",
            description: "Intense intervals to spike metabolism. Tabata style and circuit training.",
            features: ["Tabata", "Circuit Training", "Fat Loss"]
        },
        {
            id: "burn-3",
            title: "Shred Protocol",
            level: "Advanced",
            image: "/class-covers/abs-blast.png",
            description: "Pro-athlete level conditioning. Sprint intervals and complex plyometrics.",
            features: ["Sprint Intervals", "Plyometrics", "Endurance Peak"]
        }
    ],
    "flow": [
        {
            id: "flow-1",
            title: "Morning Mobilize",
            level: "Beginner",
            image: "/class-covers/pilates-core.png",
            description: "Gentle flows to wake up the spine and hips. Perfect for starting the day.",
            features: ["5 Min Flows", "Stiffness Relief", "Breathwork"]
        },
        {
            id: "flow-2",
            title: "Pilates Align",
            level: "Intermediate",
            image: "/class-covers/pilates-core.png",
            description: "Classic mat pilates to strengthen the powerhouse (core). Improve posture and alignment.",
            features: ["Mat Pilates", "Core Control", "Posture Fix"]
        },
        {
            id: "flow-3",
            title: "Power Yoga Fusion",
            level: "Advanced",
            image: "/class-covers/pilates-core.png",
            description: "Dynamic, strength-based yoga flows holding difficult poses for stability and tone.",
            features: ["Vinyasa Flow", "Balance Holds", "Deep Flexibility"]
        }
    ]
};


// Sample Sessions for Level 3
const SESSIONS = [
    { name: "Day 1: Introduction", duration: "45m", type: "Full Body" },
    { name: "Day 2: Upper Focus", duration: "45m", type: "Upper" },
    { name: "Day 3: Rest / Mobility", duration: "20m", type: "Recovery" },
    { name: "Day 4: Lower Focus", duration: "50m", type: "Lower" }
];

export default function WorkoutsDashboard() {
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [selectedProgram, setSelectedProgram] = useState<any>(null);

    // LEVEL 3: PROGRAM DETAIL VIEW (Strictly matching Class Detail Layout)
    if (selectedProgram) {
        return (
            <div className={`min-h-screen bg-[#2D2D2D] text-[#F1EDE5] relative overflow-hidden flex flex-col fixed inset-0 z-50`}>
                {/* Full-Page Hero Image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={selectedProgram.image}
                        alt={selectedProgram.title}
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Strong Dark Gradient Overlay - Top and Bottom */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#2D2D2D] z-10"></div>
                    <div className="absolute inset-0 bg-black/40 z-0"></div>
                </div>

                {/* Content Overlay */}
                <div className="relative z-20 flex flex-col h-full overflow-y-auto">
                    {/* Header Action */}
                    <div className="px-6 py-6 sticky top-0 z-30 flex justify-between items-center">
                        <button
                            onClick={() => setSelectedProgram(null)}
                            className="flex items-center text-[#F1EDE5] hover:text-[#C8A871] transition-colors gap-2 group"
                        >
                            <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-[#C8A871] group-hover:text-black transition-all">
                                <ArrowLeft className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] uppercase tracking-widest font-bold shadow-black drop-shadow-md">Back</span>
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-end px-6 pb-8 pt-[35vh]">
                        {/* Tags */}
                        <div className="flex gap-2 mb-4">
                            <span className="inline-block px-3 py-1 bg-[#C8A871] text-[#2D2D2D] text-[10px] uppercase tracking-widest rounded-sm font-bold shadow-lg">
                                {selectedProgram.level}
                            </span>
                            <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur text-white border border-white/20 text-[10px] uppercase tracking-widest rounded-sm font-bold shadow-lg">
                                {selectedCategory?.title?.split(' ')[0]} {/* e.g. SCULPT */}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-5xl md:text-6xl text-white mb-6 leading-[0.9] font-serif tracking-tight drop-shadow-lg">
                            {selectedProgram.title}
                        </h1>

                        {/* Stats Strip - Matches Book Page */}
                        <div className="flex items-center gap-6 mb-8 border-y border-white/10 py-4 backdrop-blur-sm bg-black/10">
                            <div className="flex items-center gap-2">
                                <Timer className="w-4 h-4 text-[#C8A871]" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase text-[#D7D5D2]/60 tracking-wider">Duration</span>
                                    <span className="text-sm font-bold text-[#F1EDE5]">4 Weeks</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-[#C8A871]" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase text-[#D7D5D2]/60 tracking-wider">Frequency</span>
                                    <span className="text-sm font-bold text-[#F1EDE5]">4x / Week</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <p className="text-[#D7D5D2]/90 leading-relaxed text-sm max-w-lg font-light">
                                {selectedProgram.description}
                            </p>
                        </div>

                        {/* Features List */}
                        <div className="space-y-3 mb-8">
                            {SESSIONS.map((session, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-[#3a3a3a]/60 backdrop-blur border border-[#D7D5D2]/10 rounded-xl">
                                    <div>
                                        <div className="text-[#F1EDE5] font-serif text-sm mb-0.5">{session.name}</div>
                                        <div className="text-[10px] text-[#D7D5D2]/60 uppercase tracking-wider">{session.type} • {session.duration}</div>
                                    </div>
                                    <div className="h-6 w-6 rounded-full border border-white/20 flex items-center justify-center">
                                        <Play className="w-2 h-2 fill-white" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Subscribe Button */}
                        <Button
                            onClick={async () => {
                                try {
                                    const { data: { user } } = await import("@/lib/supabase").then(m => m.supabase.auth.getUser());
                                    if (!user) {
                                        alert("Please sign in to subscribe");
                                        return;
                                    }

                                    // Use dynamic import to avoid circular dependencies if simple import fails
                                    const { workoutSessionPipeline } = await import("@/lib/services/workoutSessionPipeline");

                                    await workoutSessionPipeline.startProgramEnrollment(user.id, selectedProgram.id);

                                    alert("Subscribed! Your training schedule has been created.");
                                    window.location.href = "/glvt/diary";
                                } catch (e) {
                                    console.error(e);
                                    alert("Failed to subscribe");
                                }
                            }}
                            className="w-full bg-[#C8A871] hover:bg-[#d4b57a] text-[#2D2D2D] text-center text-sm uppercase tracking-[0.2em] font-bold py-5 rounded-xl shadow-[0_0_30px_rgba(200,168,113,0.3)] hover:scale-[1.01] transition-all h-auto"
                        >
                            Subscribe & Schedule
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // LEVEL 2: PROGRAM SELECTION (Matches Booking Class Cards)
    if (selectedCategory) {
        const programs = PROGRAMS_DATA[selectedCategory.id] || [];

        return (
            <div className="animate-in slide-in-from-right-4 duration-300 pb-20">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center text-[#D7D5D2]/60 hover:text-[#C8A871] text-[10px] uppercase tracking-[0.15em] font-medium mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Categories
                </button>

                <div className="mb-8">
                    <h2 className="text-3xl font-serif text-[#F1EDE5] mb-2">{selectedCategory.title}</h2>
                    <p className="text-[#D7D5D2]/60 text-sm max-w-md">{selectedCategory.subtitle}</p>
                </div>

                <div className="space-y-4">
                    {programs.map((program, idx) => (
                        <button
                            key={program.id}
                            onClick={() => setSelectedProgram(program)}
                            className="w-full group relative overflow-hidden rounded-2xl bg-[#3a3a3a] border border-[#D7D5D2]/10 text-left transition-all hover:border-[#C8A871]/50 shadow-[0_0_20px_rgba(0,0,0,0.2)]"
                        >
                            {/* Image Vingette Background - Matching Booking Page Card Style */}
                            <div className="absolute inset-0 z-0">
                                <Image
                                    src={program.image}
                                    alt={program.title}
                                    fill
                                    className="object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-700 grayscale-[0.3] group-hover:grayscale-0"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#202020] via-[#202020]/90 to-transparent"></div>
                            </div>

                            <div className="relative z-10 p-5 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border font-bold
                                            ${program.level === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                program.level === 'Intermediate' ? 'bg-[#C8A871]/10 text-[#C8A871] border-[#C8A871]/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20'}`}
                                        >
                                            {program.level}
                                        </span>
                                    </div>
                                    <h3 className="text-xl text-[#F1EDE5] font-serif mb-1 group-hover:text-[#C8A871] transition-colors">{program.title}</h3>
                                    <p className="text-xs text-[#D7D5D2]/60 line-clamp-1 italic">{program.description}</p>
                                </div>

                                <div className="text-right pl-4 border-l border-[#D7D5D2]/10">
                                    <div className="text-[10px] text-[#D7D5D2]/40 uppercase tracking-wider mb-1">Duration</div>
                                    <div className="text-lg font-bold text-[#F1EDE5] font-serif">4 Wks</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // LEVEL 1: CATEGORY GRID (Matches "Concept" look from shared screenshot)
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-24">

            <div className="flex justify-between items-end mb-2">
                <h2 className="text-[10px] uppercase tracking-[0.2em] text-[#D7D5D2]/40 font-bold">Choose your Focus</h2>
            </div>

            {/* Using a grid that matches the uploaded "Training Hub" Concept screenshot style */}
            <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat)}
                        className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[#D7D5D2]/10 bg-[#2D2D2D] text-left shadow-lg hover:border-[#C8A871]/50 transition-all"
                    >
                        {/* Background Image - Full Cover */}
                        <Image
                            src={cat.image}
                            alt={cat.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>

                        {/* Content */}
                        <div className="absolute inset-0 p-4 flex flex-col justify-end items-center text-center">
                            <h3 className="text-xl font-serif text-[#F1EDE5] mb-1 leading-none group-hover:text-[#C8A871] transition-colors uppercase tracking-tight">
                                {cat.title.replace('&', '\n& ')} {/* Force break for style */}
                            </h3>
                            <div className="w-8 h-px bg-[#C8A871]/50 my-2"></div>
                            <p className="text-[9px] text-[#D7D5D2]/80 uppercase tracking-widest font-medium line-clamp-2">
                                {cat.subtitle}
                            </p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 mt-6">
                <Link href="/glvt/history" className="bg-[#3a3a3a] border border-[#D7D5D2]/10 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#C8A871]/30 transition-colors">
                    <Trophy className="w-5 h-5 text-[#C8A871]" />
                    <span className="text-[10px] uppercase tracking-widest text-[#D7D5D2]/60">Personal Bests</span>
                </Link>
                <Link href="/glvt/fitness-test" className="bg-[#3a3a3a] border border-[#D7D5D2]/10 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#C8A871]/30 transition-colors">
                    <BarChart className="w-5 h-5 text-[#C8A871]" />
                    <span className="text-[10px] uppercase tracking-widest text-[#D7D5D2]/60">Results</span>
                </Link>
            </div>

        </div>
    );
}
