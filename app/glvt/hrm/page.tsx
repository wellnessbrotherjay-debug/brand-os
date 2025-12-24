"use client";

import { useState } from "react";
import { ChevronLeft, RefreshCw, Trophy, Activity, Flame } from "lucide-react";
import Link from "next/link";
import "./mobile.css";

const MOCK_HRM_DATA = {
    avg_hr: 135,
    max_hr: 178,
    calories: 650,
    ranking: 3,
    total_participants: 12,
    graph_url: "https://via.placeholder.com/600x300/333/00dcb4?text=Heart+Rate+Zone+Graph", // Placeholder
    leaderboard: [
        { rank: 1, name: "Sarah J", calories: 720 },
        { rank: 2, name: "Mike T", calories: 680 },
        { rank: 3, name: "Taylor M", calories: 650, isMe: true },
        { rank: 4, name: "Alex B", calories: 610 },
    ]
};

export default function HrmPage() {
    const [loading, setLoading] = useState(false);

    const refresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1000);
    };

    return (
        <div className="min-h-screen bg-[#111] text-white p-6 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Link href="/glvt/home" className="mr-4">
                        <ChevronLeft className="w-6 h-6 text-gray-400" />
                    </Link>
                    <span className="text-xs uppercase tracking-[0.2em] text-gray-500">Heart Rate Monitor</span>
                </div>
                <button onClick={refresh} className="p-2">
                    <RefreshCw className={`w-4 h-4 text-emerald-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Main Stats Card */}
            <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-[#1a1a1a] border border-white/5 rounded-lg p-4 text-center">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">AVG BPM</div>
                    <div className="text-xl font-mono text-white flex items-center justify-center gap-1">
                        <Activity className="w-4 h-4 text-emerald-500" /> {MOCK_HRM_DATA.avg_hr}
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/5 rounded-lg p-4 text-center">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">MAX BPM</div>
                    <div className="text-xl font-mono text-white">{MOCK_HRM_DATA.max_hr}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/5 rounded-lg p-4 text-center">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">CALORIES</div>
                    <div className="text-xl font-mono text-white flex items-center justify-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" /> {MOCK_HRM_DATA.calories}
                    </div>
                </div>
            </div>

            {/* Graph Area */}
            <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 mb-6 relative min-h-[200px] flex items-center justify-center">
                {/* Mock Graph */}
                <div className="absolute inset-0 p-4 opacity-50">
                    {/* CSS Pattern to look like a graph */}
                    <div className="w-full h-full flex items-end gap-1">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div key={i} className="flex-1 bg-emerald-500/20 rounded-t" style={{ height: `${30 + Math.random() * 60}%` }}></div>
                        ))}
                    </div>
                </div>
                <span className="relative z-10 text-xs uppercase tracking-widest text-emerald-300 bg-black/50 px-2 py-1 rounded">Heart Rate Zones</span>
            </div>

            {/* Leaderboard Section */}
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs uppercase tracking-[0.2em] text-gray-300">Class Leaderboard</span>
                </div>

                <div className="space-y-2">
                    {MOCK_HRM_DATA.leaderboard.map(u => (
                        <div key={u.rank} className={`flex items-center justify-between p-3 rounded-lg border ${u.isMe
                                ? 'bg-emerald-900/10 border-emerald-500/30'
                                : 'bg-[#1a1a1a] border-white/5'
                            }`}>
                            <div className="flex items-center gap-4">
                                <span className={`w-6 text-center font-mono ${u.rank <= 3 ? 'text-yellow-500 font-bold' : 'text-gray-500'}`}>
                                    #{u.rank}
                                </span>
                                <span className={u.isMe ? 'text-emerald-400 font-semibold' : 'text-gray-300'}>
                                    {u.name} {u.isMe && '(You)'}
                                </span>
                            </div>
                            <span className="font-mono text-sm text-gray-400">{u.calories} cal</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
