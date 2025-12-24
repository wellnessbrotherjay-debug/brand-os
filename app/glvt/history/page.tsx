"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Calendar as CalendarIcon, Trophy, Flame } from "lucide-react";
import { workoutService } from "@/lib/services/workoutService";
import { nutritionService } from "@/lib/services/nutritionService";
import { supabase } from "@/lib/supabase";

export default function HistoryPage() {
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<any[]>([]);
    const [nutritionLogs, setNutritionLogs] = useState<any[]>([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Completed Sessions
            const { data: sessionData, error: sessionError } = await supabase
                .from('user_workout_sessions')
                .select(`
                    *,
                    workout:workouts ( title, cover_image_url )
                `)
                .eq('user_id', user.id)
                .order('started_at', { ascending: false });

            if (sessionData) setSessions(sessionData);

            // 2. Fetch Nutrition Logs (Last 7 days for simplicity or all)
            const { data: nutritionData, error: nutritionError } = await supabase
                .from('nutrition_daily_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (nutritionData) setNutritionLogs(nutritionData);

        } catch (e) {
            console.error("Error loading history:", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center text-[#C8A871]">Loading History...</div>;

    return (
        <div className="min-h-screen bg-[#0E0E0E] text-[#F1EDE5] font-sans">
            {/* Header */}
            <div className="p-6 pb-2">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/glvt/home" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                        <ChevronLeft className="w-6 h-6 text-[#F1EDE5]" />
                    </Link>
                    <h1 className="text-2xl font-serif text-[#F1EDE5]">History</h1>
                </div>
            </div>

            <div className="px-6 space-y-8 pb-20">
                {/* Recent Workouts */}
                <section>
                    <h2 className="text-lg font-bold text-[#C8A871] mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5" /> Recent Workouts
                    </h2>

                    <div className="space-y-4">
                        {sessions.length === 0 ? (
                            <div className="p-4 rounded-xl bg-[#161616] border border-white/5 text-center text-[#666] text-sm">
                                No completed workouts yet.
                            </div>
                        ) : (
                            sessions.map(session => (
                                <div key={session.id} className="p-4 rounded-xl bg-[#161616] border border-white/5 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-[#F1EDE5]">{session.workout?.title || "Custom Workout"}</h3>
                                        <div className="text-xs text-[#888] flex items-center gap-2 mt-1">
                                            <CalendarIcon className="w-3 h-3" />
                                            {new Date(session.started_at).toLocaleDateString(undefined, {
                                                month: 'short', day: 'numeric', alert: 'hour', minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs px-2 py-1 rounded border ${session.completed_at
                                                ? 'border-green-500/30 text-green-500 bg-green-500/10'
                                                : 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10'
                                            }`}>
                                            {session.completed_at ? 'Completed' : 'In Progress'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Nutrition History */}
                <section>
                    <h2 className="text-lg font-bold text-[#C8A871] mb-4 flex items-center gap-2">
                        <Flame className="w-5 h-5" /> Nutrition History
                    </h2>

                    <div className="space-y-4">
                        {nutritionLogs.length === 0 ? (
                            <div className="p-4 rounded-xl bg-[#161616] border border-white/5 text-center text-[#666] text-sm">
                                No nutrition logs found.
                            </div>
                        ) : (
                            nutritionLogs.map(log => (
                                <div key={log.id} className="p-4 rounded-xl bg-[#161616] border border-white/5 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-[#F1EDE5]">
                                            {new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </h3>
                                        <div className="text-xs text-[#888] mt-1">
                                            {log.total_calories} kcal
                                        </div>
                                    </div>
                                    <div className="flex gap-3 text-xs">
                                        <div className="text-center">
                                            <div className="font-bold text-[#C8A871]">{log.total_protein_g}g</div>
                                            <div className="text-[#666]">Pro</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-[#F1EDE5]">{log.total_carbs_g}g</div>
                                            <div className="text-[#666]">Carb</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-[#F1EDE5]">{log.total_fats_g}g</div>
                                            <div className="text-[#666]">Fat</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
