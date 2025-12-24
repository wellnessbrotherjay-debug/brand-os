"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Activity, Info, Scale, Waves, Dumbbell, Droplets, Bone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DATA = [
    { date: "Oct 02", weight: 83.5 },
    { date: "Oct 03", weight: 83.2 },
    { date: "Oct 04", weight: 83.0 },
    { date: "Oct 05", weight: 83.1 },
    { date: "Oct 06", weight: 83.0 },
    { date: "Oct 07", weight: 82.8 },
    { date: "Oct 08", weight: 83.0 },
];

export default function MetricsDashboard() {
    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">

            {/* Main Digital Scale Display - HIGH IMPACT */}
            <Card className="bg-[#3a3a3a] border border-[#D7D5D2]/15 shadow-[0_0_30px_rgba(0,0,0,0.3)] overflow-hidden relative">
                <div className="absolute top-6 right-6">
                    <Badge variant="outline" className="border-[#D7D5D2]/20 text-[#D7D5D2]/40 text-[9px] uppercase tracking-[0.15em] font-normal gap-2 flex items-center py-1.5 px-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        Synced: Withings Body+
                    </Badge>
                </div>

                <CardContent className="pt-16 pb-16 text-center relative z-10">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-[#D7D5D2]/40 font-medium mb-6">Current Weight</div>
                    <div className="flex items-baseline justify-center gap-2 mb-6">
                        <span className="text-8xl md:text-9xl font-serif text-[#F1EDE5] tracking-tighter drop-shadow-lg">83.0</span>
                        <span className="text-2xl text-[#D7D5D2]/30 font-light translate-y-[-20px]">kg</span>
                    </div>
                    <div className="inline-flex items-center gap-3 px-5 py-2 bg-[#2D2D2D] rounded-full border border-[#D7D5D2]/5 shadow-inner">
                        <TrendingDown className="w-4 h-4 text-[#C8A871]" />
                        <span className="text-xs uppercase tracking-widest text-[#C8A871] font-bold">-0.5 kg</span>
                        <span className="text-[10px] text-[#D7D5D2]/30 ml-1 uppercase tracking-wider">vs last week</span>
                    </div>
                </CardContent>

                {/* Subtle grid background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none opacity-10"></div>
            </Card>

            {/* Detailed Metrics Grid - Unbunched & Large */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Body Fat */}
                <Card className="bg-[#3a3a3a] border border-[#D7D5D2]/10 hover:border-[#C8A871]/30 transition-colors group aspect-square flex flex-col justify-center">
                    <CardContent className="p-0 flex flex-col items-center text-center">
                        <Waves className="w-6 h-6 text-[#C8A871] mb-4 opacity-80" />
                        <div className="text-3xl font-serif text-[#F1EDE5] mb-1">20.0<span className="text-sm text-[#D7D5D2]/30 ml-1">%</span></div>
                        <div className="text-[9px] uppercase tracking-[0.2em] text-[#D7D5D2]/40">Body Fat</div>
                    </CardContent>
                </Card>

                {/* Muscle Mass */}
                <Card className="bg-[#3a3a3a] border border-[#D7D5D2]/10 hover:border-[#C8A871]/30 transition-colors group aspect-square flex flex-col justify-center">
                    <CardContent className="p-0 flex flex-col items-center text-center">
                        <Dumbbell className="w-6 h-6 text-[#F1EDE5] mb-4 opacity-60" />
                        <div className="text-3xl font-serif text-[#F1EDE5] mb-1">65.0<span className="text-sm text-[#D7D5D2]/30 ml-1">kg</span></div>
                        <div className="text-[9px] uppercase tracking-[0.2em] text-[#D7D5D2]/40">Muscle Mass</div>
                    </CardContent>
                </Card>

                {/* Water % */}
                <Card className="bg-[#3a3a3a] border border-[#D7D5D2]/10 hover:border-[#C8A871]/30 transition-colors group aspect-square flex flex-col justify-center">
                    <CardContent className="p-0 flex flex-col items-center text-center">
                        <Droplets className="w-6 h-6 text-blue-400 mb-4 opacity-60" />
                        <div className="text-3xl font-serif text-[#F1EDE5] mb-1">58.2<span className="text-sm text-[#D7D5D2]/30 ml-1">%</span></div>
                        <div className="text-[9px] uppercase tracking-[0.2em] text-[#D7D5D2]/40">Hydration</div>
                    </CardContent>
                </Card>

                {/* Bone Mass */}
                <Card className="bg-[#3a3a3a] border border-[#D7D5D2]/10 hover:border-[#C8A871]/30 transition-colors group aspect-square flex flex-col justify-center">
                    <CardContent className="p-0 flex flex-col items-center text-center">
                        <Bone className="w-6 h-6 text-[#D7D5D2] mb-4 opacity-40" />
                        <div className="text-3xl font-serif text-[#F1EDE5] mb-1">3.4<span className="text-sm text-[#D7D5D2]/30 ml-1">kg</span></div>
                        <div className="text-[9px] uppercase tracking-[0.2em] text-[#D7D5D2]/40">Bone Mass</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
