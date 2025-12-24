"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Trophy, Activity, Flame, Heart, Share2, Download, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { getHrmDataGraphForBooking } from "@/lib/services/exequteMpApi";

export default function HRMResultsPage() {
    const searchParams = useSearchParams();
    // In production, this comes from the URL, e.g. /glvt/hrm/results?bookingId=...
    const bookingId = searchParams?.get('bookingId') || '';

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);

    useEffect(() => {
        if (!bookingId) {
            // Fallback for demo if no ID is present
            setLoading(false);
            return;
        }

        async function loadData() {
            try {
                setLoading(true);
                // Call MP API
                const response = await getHrmDataGraphForBooking(bookingId);

                // Map MP response to UI structure
                // MP returns: { hrm_data, hrm_combined_graph: { imageUrl }, ranking: [], my_ranking }
                setData({
                    avgHR: response.hrm_data?.avg_hr || 0,
                    maxHR: response.hrm_data?.max_hr || 0,
                    calories: response.hrm_data?.calories || 0,
                    ranking: response.my_ranking?.rank || '-',
                    totalParticipants: response.ranking?.length || 0,
                    graphUrl: response.hrm_combined_graph?.imageUrl,
                    leaderboard: response.ranking || [],
                    className: "HRM Workout", // Assuming generic or fetched elsewhere
                    date: new Date(),
                    duration: response.hrm_data?.duration || 0
                });
            } catch (err: any) {
                console.error("Failed to load HRM data", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [bookingId]);

    // Render Loading
    if (loading) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading Results...</div>;
    }

    // Render Error or Empty
    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">No Data Found</h2>
                <p className="text-gray-400 mb-6">We couldn't retrieve the results for this workout.</p>
                <Link href="/glvt/home" className="px-6 py-3 bg-white text-black rounded font-bold uppercase text-xs tracking-widest">
                    Return Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/glvt/home" className="flex items-center gap-2 text-gray-400 hover:text-white">
                        <ChevronLeft className="w-6 h-6" />
                        <span className="text-xs uppercase tracking-[0.2em]">Home</span>
                    </Link>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <Share2 className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Class Hero Image */}
            <div className="relative h-64">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-[#1a1a1a]"></div>
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-widest rounded-full mb-3 border border-emerald-500/30">
                        Workout Complete
                    </div>
                    <h1 className="text-4xl font-serif text-white mb-2">{data.className}</h1>
                    <p className="text-sm text-gray-400">{format(data.date, "EEEE, MMMM d 'at' h:mm a")}</p>
                </div>
            </div>

            <div className="px-6 pb-8">
                {/* Key Stats */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-[#111] border border-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-emerald-500" />
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Avg HR</div>
                        </div>
                        <div className="text-2xl font-mono text-white">{data.avgHR}</div>
                        <div className="text-xs text-gray-500">bpm</div>
                    </div>
                    <div className="bg-[#111] border border-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Max HR</div>
                        </div>
                        <div className="text-2xl font-mono text-white">{data.maxHR}</div>
                        <div className="text-xs text-gray-500">bpm</div>
                    </div>
                    <div className="bg-[#111] border border-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Calories</div>
                        </div>
                        <div className="text-2xl font-mono text-white">{data.calories}</div>
                        <div className="text-xs text-gray-500">kcal</div>
                    </div>
                </div>

                {/* Graph Image from API */}
                {data.graphUrl && (
                    <div className="mb-8">
                        <h2 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-4">Performance Graph</h2>
                        <div className="bg-[#111] border border-white/10 rounded-lg p-2 overflow-hidden">
                            <img
                                src={data.graphUrl}
                                alt="Heart Rate Graph"
                                className="w-full h-auto rounded"
                            />
                        </div>
                    </div>
                )}


                {/* Class Ranking */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <h2 className="text-xs uppercase tracking-[0.2em] text-gray-300">Class Ranking</h2>
                        </div>
                        <span className="text-xs text-gray-500">#{data.ranking} of {data.totalParticipants}</span>
                    </div>

                    <div className="space-y-2">
                        {data.leaderboard.map((user: any, idx: number) => (
                            <div
                                key={idx}
                                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${user.isMe // Assuming API marks this, otherwise user comparison logic needed
                                    ? 'bg-emerald-900/20 border-emerald-500/30'
                                    : 'bg-[#111] border-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`w-8 text-center font-mono text-lg ${(idx + 1) <= 3 ? 'text-yellow-500 font-bold' : 'text-gray-500'}`}>
                                        #{idx + 1}
                                    </span>

                                    <div>
                                        <div className={`text-sm font-medium text-white`}>
                                            {user.username || user.name || "Athlete"}
                                        </div>
                                        <div className="text-xs text-gray-500">Avg {user.avg_hr || 0} bpm</div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-lg font-mono text-white">{user.calories}</div>
                                    <div className="text-xs text-gray-500">kcal</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Link
                        href="/glvt/home"
                        className="block w-full py-4 border border-white/20 text-white text-center text-xs uppercase tracking-[0.2em] font-bold rounded hover:bg-white/10 transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="max-w-md w-full bg-[#0a0a0a] border border-white/20 rounded-lg p-6">
                        <h2 className="text-xl font-serif text-white mb-4">Share Your Results</h2>
                        <div className="space-y-3">
                            <button className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                                Share to WeChat
                            </button>
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="w-full py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
