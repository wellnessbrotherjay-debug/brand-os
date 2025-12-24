"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { GLVT_THEME, commonStyles } from "../theme";
import { DayPill, FilterChip } from "./_components/shared";

// Coach profiles with real images
const COACHES: any = {
    "mike-chen": {
        name: "Coach Mike Chen",
        specialty: "Glute Activation & Power",
        bio: "10+ years specializing in lower body biomechanics and glute development. Former Olympic weightlifting coach.",
        certifications: ["NASM-CPT", "CSCS", "Olympic Lifting L2"],
        image: "/coaches/mike-chen.png"
    },
    "sarah-liu": {
        name: "Sarah Liu",
        specialty: "Core Stability & Pilates",
        bio: "Pilates master instructor with expertise in core rehabilitation and functional movement patterns.",
        certifications: ["Pilates Master", "Physical Therapy", "Yoga RYT-500"],
        image: "/coaches/sarah-liu.png"
    },
    "alex-wong": {
        name: "Coach Alex Wong",
        specialty: "Functional Core Training",
        bio: "Sports performance specialist focusing on core strength for athletic performance and injury prevention.",
        certifications: ["CSCS", "FMS", "TRX Master"],
        image: "/coaches/alex-wong.png"
    },
    "emma-park": {
        name: "Emma Park",
        specialty: "Glute Sculpting",
        bio: "Body composition expert specializing in glute hypertrophy and aesthetic development.",
        certifications: ["NASM-CPT", "Nutrition Coach", "Bodybuilding Specialist"],
        image: "/coaches/emma-park.png"
    },
    "danny-kim": {
        name: "Coach Danny Kim",
        specialty: "High-Intensity Core",
        bio: "Former MMA fighter bringing explosive core training techniques to maximize power and endurance.",
        certifications: ["CrossFit L2", "Kettlebell Master", "MMA Conditioning"],
        image: "/coaches/danny-kim.png"
    },
    "jessica-tan": {
        name: "Jessica Tan",
        specialty: "Lower Body Power",
        bio: "Powerlifting champion with focus on glute and hamstring strength development.",
        certifications: ["USAPL Coach", "Starting Strength", "Biomechanics Specialist"],
        image: "/coaches/jessica-tan.png"
    }
};

// Class types - ALL focused on glutes and core
const CLASS_TEMPLATES = [
    {
        id: "glute-activation",
        name: "Glute Activation",
        coachId: "mike-chen",
        duration: "60 min",
        intensity: "Medium",
        spots: 12,
        description: "Wake up dormant glutes with targeted activation exercises. Perfect for building mind-muscle connection and preparing for heavier lifts.",
        coverImage: "/class-covers/glutes-workout.png",
        focus: "Glutes"
    },
    {
        id: "core-foundation",
        name: "Core Foundation",
        coachId: "sarah-liu",
        duration: "75 min",
        intensity: "Low",
        spots: 15,
        description: "Build a rock-solid core foundation with controlled movements. Focus on stability, breathing, and proper engagement.",
        coverImage: "/class-covers/core-strength.png",
        focus: "Core"
    },
    {
        id: "pilates-core",
        name: "Pilates Core",
        coachId: "sarah-liu",
        duration: "60 min",
        intensity: "Medium",
        spots: 12,
        description: "Classical pilates movements targeting deep core muscles. Improve posture, stability, and body awareness.",
        coverImage: "/class-covers/pilates-core.png",
        focus: "Core"
    },
    {
        id: "glute-sculpt",
        name: "Glute Sculpt",
        coachId: "emma-park",
        duration: "50 min",
        intensity: "High",
        spots: 10,
        description: "Hypertrophy-focused glute training with progressive overload. Build rounder, stronger glutes.",
        coverImage: "/class-covers/glute-sculpt.png",
        focus: "Glutes"
    },
    {
        id: "abs-blast",
        name: "Abs Blast",
        coachId: "danny-kim",
        duration: "45 min",
        intensity: "High",
        spots: 15,
        description: "High-intensity core workout combining static holds and dynamic movements. Get shredded abs.",
        coverImage: "/class-covers/abs-blast.png",
        focus: "Core"
    },
    {
        id: "lower-body-power",
        name: "Lower Body Power",
        coachId: "jessica-tan",
        duration: "60 min",
        intensity: "High",
        spots: 10,
        description: "Build explosive glute and hamstring power with compound lifts. Deadlifts, hip thrusts, and more.",
        coverImage: "/class-covers/lower-body-power.png",
        focus: "Glutes"
    }
];

// Generate 7-day schedule
const generateSchedule = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const schedule: any[] = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = addDays(weekStart, dayOffset);
        const daySchedule = {
            date,
            morning: [] as any[],
            evening: [] as any[]
        };

        // Morning classes (6am, 8am, 10am)
        const morningTimes = ["06:00", "08:00", "10:00"];
        const morningClasses = [
            CLASS_TEMPLATES[1], // Core Foundation
            CLASS_TEMPLATES[0], // Glute Activation
            CLASS_TEMPLATES[2]  // Pilates Core
        ];

        morningTimes.forEach((time, idx) => {
            const [hours, minutes] = time.split(':').map(Number);
            const classDate = new Date(date);
            classDate.setHours(hours, minutes, 0, 0);

            const classTemplate = morningClasses[idx];
            const bookedSpots = Math.floor(Math.random() * (classTemplate.spots - 3)) + 1;

            daySchedule.morning.push({
                ...classTemplate,
                instructor: COACHES[classTemplate.coachId].name,
                time: classDate,
                timeStr: time,
                bookedSpots,
                availableSpots: classTemplate.spots - bookedSpots,
                period: 'morning'
            });
        });

        // Evening classes (5pm, 6:30pm, 8pm)
        const eveningTimes = ["17:00", "18:30", "20:00"];
        const eveningClasses = [
            CLASS_TEMPLATES[5], // Lower Body Power
            CLASS_TEMPLATES[4], // Abs Blast
            CLASS_TEMPLATES[3]  // Glute Sculpt
        ];

        eveningTimes.forEach((time, idx) => {
            const [hours, minutes] = time.split(':').map(Number);
            const classDate = new Date(date);
            classDate.setHours(hours, minutes, 0, 0);

            const classTemplate = eveningClasses[idx];
            const bookedSpots = Math.floor(Math.random() * (classTemplate.spots - 2)) + 1;

            daySchedule.evening.push({
                ...classTemplate,
                instructor: COACHES[classTemplate.coachId].name,
                time: classDate,
                timeStr: time,
                bookedSpots,
                availableSpots: classTemplate.spots - bookedSpots
            });
        });

        schedule.push(daySchedule);
    }

    return schedule;
};

export default function BookingPage() {
    const [schedule] = useState(generateSchedule());
    const [selectedDay, setSelectedDay] = useState(0);
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [showClassDetail, setShowClassDetail] = useState(false);
    const [showCoachProfile, setShowCoachProfile] = useState(false);
    const [selectedCoach, setSelectedCoach] = useState<any>(null);

    const currentDaySchedule = schedule[selectedDay];

    const handleClassClick = (classItem: any) => {
        setSelectedClass(classItem);
        setShowClassDetail(true);
    };

    const handleCoachClick = (coachId: string) => {
        setSelectedCoach(COACHES[coachId]);
        setShowCoachProfile(true);
    };

    const handleBack = () => {
        if (showCoachProfile) {
            setShowCoachProfile(false);
            setSelectedCoach(null);
        } else if (showClassDetail) {
            setShowClassDetail(false);
            setSelectedClass(null);
        }
    };

    // Coach Profile Modal
    if (showCoachProfile && selectedCoach) {
        return (
            <div className={`fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col animate-in slide-in-from-bottom duration-300 ${commonStyles.pageContainer}`}>
                <div className="relative h-[45vh] w-full">
                    <Image
                        src={selectedCoach.image}
                        alt={selectedCoach.name}
                        fill
                        className="object-cover"
                    />
                    <button
                        onClick={() => setShowCoachProfile(false)}
                        className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2D2D2D] via-transparent to-transparent"></div>
                </div>

                <div className="flex-1 px-6 -mt-10 relative z-10">
                    <div className="bg-[#2D2D2D] border border-[#D7D5D2]/10 rounded-t-3xl p-6 h-full shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                        <h2 className="text-3xl font-serif text-[#F1EDE5] mb-1">{selectedCoach.name}</h2>
                        <p className="text-xs text-[#C8A871] uppercase tracking-widest mb-6 font-bold">{selectedCoach.specialty}</p>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#D7D5D2]/40 mb-3">About</h3>
                                <p className="text-[#D7D5D2]/80 text-sm leading-relaxed">{selectedCoach.bio}</p>
                            </div>

                            <div>
                                <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#D7D5D2]/40 mb-3">Certifications</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCoach.certifications.map((cert: string, idx: number) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 bg-[#3a3a3a] text-[#C8A871] text-[10px] uppercase tracking-wider rounded-full border border-[#D7D5D2]/10"
                                        >
                                            {cert}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Class Detail View - THE GOLD STANDARD REFERENCE
    if (showClassDetail && selectedClass) {
        const coach = COACHES[selectedClass.coachId];

        return (
            <div className={`min-h-screen bg-[#2D2D2D] text-[#F1EDE5] relative overflow-hidden flex flex-col`}>
                {/* Full-Page Hero Image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={selectedClass.coverImage}
                        alt={selectedClass.name}
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Strong Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#2D2D2D]"></div>
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 flex flex-col h-full overflow-y-auto">
                    {/* Header Action */}
                    <div className="px-6 py-6 sticky top-0 z-20 flex justify-between items-center">
                        <button
                            onClick={handleBack}
                            className="flex items-center text-[#F1EDE5]/80 hover:text-[#C8A871] transition-colors gap-2"
                        >
                            <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center">
                                <ChevronLeft className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] uppercase tracking-widest font-bold shadow-black drop-shadow-md">Back</span>
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-end px-6 pb-8 pt-[40vh]">
                        {/* Badge */}
                        <div className="mb-4">
                            <span className="inline-block px-3 py-1 bg-[#C8A871] text-[#2D2D2D] text-[10px] uppercase tracking-widest rounded-sm font-bold shadow-lg">
                                {selectedClass.focus} Series
                            </span>
                        </div>

                        {/* Class Name */}
                        <h1 className="text-5xl md:text-6xl text-white mb-6 leading-[0.9] font-serif tracking-tight drop-shadow-lg">
                            {selectedClass.name}
                        </h1>

                        {/* Stats Strip */}
                        <div className="flex items-center gap-6 mb-8 border-y border-white/10 py-4 backdrop-blur-sm bg-black/10">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#C8A871]" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase text-[#D7D5D2]/60 tracking-wider">Start</span>
                                    <span className="text-sm font-bold text-[#F1EDE5]">{format(selectedClass.time, 'h:mm a')}</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-[#C8A871]" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase text-[#D7D5D2]/60 tracking-wider">Spots</span>
                                    <span className="text-sm font-bold text-[#F1EDE5]">{selectedClass.availableSpots} left</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🔥</span>
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase text-[#D7D5D2]/60 tracking-wider">Intensity</span>
                                    <span className="text-sm font-bold text-[#F1EDE5]">{selectedClass.intensity}</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <p className="text-[#D7D5D2]/90 leading-relaxed text-sm max-w-lg font-light">
                                {selectedClass.description}
                            </p>
                        </div>

                        {/* Coach Section */}
                        <div className="mb-8">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-[#D7D5D2]/60 mb-3 font-bold">Led By</div>
                            <button
                                onClick={() => handleCoachClick(selectedClass.coachId)}
                                className="flex items-center gap-4 group bg-[#3a3a3a]/40 p-3 rounded-xl border border-white/5 hover:bg-[#3a3a3a]/60 transition-all backdrop-blur-md"
                            >
                                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#C8A871]/30">
                                    <Image
                                        src={coach.image}
                                        alt={coach.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="text-base font-serif text-[#F1EDE5] group-hover:text-[#C8A871] transition-colors">{coach.name}</div>
                                    <div className="text-xs text-[#D7D5D2]/60 uppercase tracking-wider">{coach.specialty}</div>
                                </div>
                            </button>
                        </div>

                        {/* Book Button */}
                        <Link
                            href={`/glvt/book/confirm?class=${selectedClass.id}&time=${selectedClass.time.toISOString()}`}
                            className="w-full bg-[#C8A871] hover:bg-[#d4b57a] text-[#2D2D2D] text-center text-sm uppercase tracking-[0.2em] font-bold py-5 rounded-xl shadow-[0_0_30px_rgba(200,168,113,0.3)] hover:scale-[1.01] transition-all"
                        >
                            Reserve Spot
                        </Link>
                    </div>
                </div>
            </div>
        );
    }


    // Main Schedule Grid
    return (
        <div className={`min-h-screen flex flex-col ${commonStyles.pageContainer}`} style={{ fontFamily: GLVT_THEME.fonts.sans }}>
            {/* Header */}
            <header className="px-6 py-6 border-b border-[#D7D5D2]/5 sticky top-0 bg-[#2D2D2D]/95 backdrop-blur z-20 flex justify-between items-center">
                <Link href="/glvt/home" className="flex items-center text-[#F1EDE5] hover:text-[#C8A871] transition-colors">
                    <ChevronLeft className="w-5 h-5 mr-4" />
                    <div>
                        <h1 className="text-2xl font-serif leading-none">Schedule</h1>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-[#D7D5D2]/50">Select Session</span>
                    </div>
                </Link>
                <div className="w-10 h-10 rounded-full bg-[#3a3a3a] flex items-center justify-center border border-[#D7D5D2]/10 text-[#C8A871]">
                    <Calendar className="w-5 h-5" />
                </div>
            </header>

            <main className="flex-1 px-6 py-6">

                {/* Day Horizontal Scroll */}
                <div className="mb-8 overflow-x-auto scrollbar-hide -mx-6 px-6 no-scrollbar pb-4">
                    <div className="flex gap-3">
                        {schedule.map((day, idx) => (
                            <DayPill
                                key={idx}
                                date={day.date}
                                isSelected={idx === selectedDay}
                                isToday={isSameDay(day.date, new Date())}
                                onClick={() => setSelectedDay(idx)}
                            />
                        ))}
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide -mx-6 px-6 no-scrollbar">
                    {["All", "Morning", "Evening", "Glutes", "Core"].map((filter) => (
                        <FilterChip
                            key={filter}
                            label={filter}
                            isActive={filter === "All"}
                            onClick={() => { }}
                        />
                    ))}
                </div>

                <div className="space-y-10 pb-20">
                    {/* Morning Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px flex-1 bg-[#D7D5D2]/10"></div>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#D7D5D2]/40 font-bold">Morning</span>
                            <div className="h-px flex-1 bg-[#D7D5D2]/10"></div>
                        </div>

                        <div className="space-y-4">
                            {currentDaySchedule.morning.map((classItem: any, idx: number) => (
                                <ClassCardButton key={idx} classItem={classItem} onClick={() => handleClassClick(classItem)} />
                            ))}
                        </div>
                    </section>

                    {/* Evening Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px flex-1 bg-[#D7D5D2]/10"></div>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#D7D5D2]/40 font-bold">Evening</span>
                            <div className="h-px flex-1 bg-[#D7D5D2]/10"></div>
                        </div>

                        <div className="space-y-4">
                            {currentDaySchedule.evening.map((classItem: any, idx: number) => (
                                <ClassCardButton key={idx} classItem={classItem} onClick={() => handleClassClick(classItem)} />
                            ))}
                        </div>
                    </section>
                </div>

            </main>
        </div>
    );
}

// Sub-component for clean rendering inside the main file without import loops
function ClassCardButton({ classItem, onClick }: { classItem: any, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full group relative overflow-hidden rounded-2xl bg-[#3a3a3a] border border-[#D7D5D2]/10 text-left transition-all hover:border-[#C8A871]/50 shadow-[0_0_20px_rgba(0,0,0,0.2)]"
        >
            {/* Image Vingette Background */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={classItem.coverImage}
                    alt={classItem.name}
                    fill
                    className="object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-700 grayscale-[0.3] group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#202020] via-[#202020]/90 to-transparent"></div>
            </div>

            <div className="relative z-10 p-5 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-[#C8A871]/10 text-[#C8A871] text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border border-[#C8A871]/20 font-bold">
                            {classItem.focus}
                        </span>
                        <span className="text-[9px] text-[#D7D5D2]/50 uppercase tracking-wider">{classItem.duration}</span>
                    </div>
                    <h3 className="text-xl text-[#F1EDE5] font-serif mb-1 group-hover:text-[#C8A871] transition-colors">{classItem.name}</h3>
                    <p className="text-xs text-[#D7D5D2]/60">with {classItem.instructor}</p>
                </div>

                <div className="text-right pl-4 border-l border-[#D7D5D2]/10">
                    <div className="text-xl font-bold text-[#F1EDE5] font-serif">{format(classItem.time, 'h:mm')}</div>
                    <div className="text-[9px] uppercase text-[#D7D5D2]/40 tracking-wider text-right">{format(classItem.time, 'a')}</div>
                </div>
            </div>
        </button>
    )
}
