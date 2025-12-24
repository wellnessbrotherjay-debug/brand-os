"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Calendar as CalendarIcon, CheckCircle, Circle, Play } from "lucide-react";
import Link from "next/link";
import { glvtTheme } from "../config/theme";
import { scheduleService } from "@/lib/services/scheduleService";
import { useRouter } from "next/navigation";

export default function DiaryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState<any[]>([]);

    // Using today as default for demo
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadSchedule();
    }, [selectedDate]);

    const loadSchedule = async () => {
        setLoading(true);

        try {
            // Get real user
            const { data: { user } } = await import("@/lib/supabase").then(m => m.supabase.auth.getUser());
            if (!user) return; // or redirect to login

            const userId = user.id;

            const data = await scheduleService.getScheduleForDate(userId, selectedDate);

            // Transform for UI if needed (our service now returns joined titles)
            // But we need to map to UI shape if fields differ
            const uiData = data.map((item: any) => ({
                id: item.id,
                item_type: item.item_type,
                title: item.title, // Enriched in service
                time: item.start_time ? new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Anytime",
                status: item.status,
                reference_id: item.reference_id,
                summary: item.item_type === 'workout' ? 'Scheduled Workout' : ''
            }));

            setSchedule(uiData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleStartWorkout = (workoutId: string) => {
        // Create session -> Redirect
        // For demo: just redirect to session start page
        router.push(`/glvt/workouts/session/${workoutId}`);
    };

    return (
        <div
            className="min-h-screen p-6 flex flex-col"
            style={{ backgroundColor: glvtTheme.colors.background.primary, color: glvtTheme.colors.text.primary }}
        >
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <Link href="/glvt/home" className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-[#888]" />
                </Link>
                <h1 className="text-xl tracking-[0.1em]" style={{ fontFamily: glvtTheme.fonts.title }}>MY DIARY</h1>
                <button className="p-2 -mr-2 text-[#C8A871]">
                    <CalendarIcon className="w-6 h-6" />
                </button>
            </header>

            {/* Date Selector (Simplified) */}
            <div className="flex justify-between items-center mb-8 px-2">
                <div className="text-center opacity-50 text-xs">
                    <div className="uppercase tracking-widest mb-1">Mon</div>
                    <div className="font-bold text-lg">12</div>
                </div>
                <div className="text-center opacity-50 text-xs">
                    <div className="uppercase tracking-widest mb-1">Tue</div>
                    <div className="font-bold text-lg">13</div>
                </div>
                <div className="text-center text-[#C8A871] scale-110">
                    <div className="uppercase tracking-widest mb-1 text-[10px] font-bold">Today</div>
                    <div className="font-bold text-2xl h-10 w-10 rounded-full bg-[#C8A871]/10 flex items-center justify-center border border-[#C8A871]/30">14</div>
                </div>
                <div className="text-center opacity-50 text-xs">
                    <div className="uppercase tracking-widest mb-1">Thu</div>
                    <div className="font-bold text-lg">15</div>
                </div>
                <div className="text-center opacity-50 text-xs">
                    <div className="uppercase tracking-widest mb-1">Fri</div>
                    <div className="font-bold text-lg">16</div>
                </div>
            </div>

            {/* Timeline / Schedule List */}
            <div className="flex-1 space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-px bg-white/10 z-0" />

                {schedule.map((item, idx) => (
                    <div key={item.id} className="relative z-10 flex gap-6 group">
                        {/* Status Indicator */}
                        <div className="flex flex-col items-center pt-1">
                            {item.status === 'completed' ? (
                                <div className="w-10 h-10 rounded-full bg-[#C8A871] text-[#0E0E0E] flex items-center justify-center shadow-[0_0_15px_rgba(200,168,113,0.3)]">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-white/20 flex items-center justify-center">
                                    <Circle className="w-5 h-5 text-[#666]" />
                                </div>
                            )}
                        </div>

                        {/* Card */}
                        <div className="flex-1 bg-[#1A1A1A] rounded-xl p-5 border border-white/5 hover:border-[#C8A871]/30 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] uppercase tracking-widest text-[#666] font-bold">{item.time}</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider ${item.item_type === 'workout' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'
                                    }`}>
                                    {item.item_type}
                                </span>
                            </div>

                            <h3 className="text-lg text-[#F1EDE5] font-serif mb-1">{item.title}</h3>
                            {item.summary && <p className="text-xs text-[#888]">{item.summary}</p>}

                            {/* Action Button for Pending Workouts */}
                            {item.item_type === 'workout' && item.status === 'pending' && (
                                <button
                                    onClick={() => handleStartWorkout(item.reference_id)}
                                    className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#C8A871] hover:text-white transition-colors"
                                >
                                    <Play className="w-3 h-3 fill-current" /> Start Session
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
