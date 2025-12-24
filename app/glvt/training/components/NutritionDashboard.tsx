"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, AlertCircle, Sparkles, Flame, Plus, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const DATA = [
    { name: "Consumed", value: 0 },
    { name: "Remaining", value: 3275.34 },
];

const COLORS = ["#C8A871", "#454545"];

export default function NutritionDashboard() {
    const tdee = 3275;

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">

            {/* Hero Calorie Card - Matches Metrics Scale Style */}
            <Card className="bg-[#3a3a3a] border border-[#D7D5D2]/15 shadow-[0_0_30px_rgba(0,0,0,0.3)] overflow-hidden relative">
                <CardContent className="pt-12 pb-12 relative z-10 grid md:grid-cols-2 gap-8 items-center">
                    <div className="text-center md:text-left md:pl-8">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-[#D7D5D2]/50 font-medium mb-4 flex items-center justify-center md:justify-start gap-2">
                            <Flame className="w-4 h-4 text-[#C8A871]" /> Daily Energy Budget
                        </div>
                        <div className="flex items-baseline justify-center md:justify-start gap-2 mb-4">
                            <span className="text-7xl md:text-8xl font-serif text-[#F1EDE5] tracking-tighter drop-shadow-lg">{tdee}</span>
                            <span className="text-xl text-[#D7D5D2]/30 font-light">kcal</span>
                        </div>
                        <Button className="bg-[#C8A871] text-[#2D2D2D] hover:bg-[#d4b57a] font-bold text-[10px] uppercase tracking-widest px-6 h-10 rounded-full shadow-lg">
                            <Plus className="w-3 h-3 mr-2" /> Log First Meal
                        </Button>
                    </div>

                    <div className="h-[200px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={85}
                                    startAngle={90}
                                    endAngle={-270}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center text in Pie */}
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-xs uppercase tracking-widest text-[#D7D5D2]/40">Remaining</span>
                            <span className="text-2xl font-serif text-[#F1EDE5]">{tdee}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Macro Grid - Big Numbers */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Protein", val: "0", target: "202g", color: "bg-[#C8A871]" },
                    { label: "Carbs", val: "0", target: "726g", color: "bg-[#A0A0A0]" },
                    { label: "Fat", val: "0", target: "74g", color: "bg-[#505050]" }
                ].map(macro => (
                    <Card key={macro.label} className="bg-[#3a3a3a] border border-[#D7D5D2]/15 relative overflow-hidden group">
                        <CardContent className="p-6 text-center">
                            <div className="text-[9px] uppercase tracking-[0.2em] text-[#D7D5D2]/40 mb-3">{macro.label}</div>
                            <div className="text-3xl lg:text-4xl font-serif text-[#F1EDE5] mb-2">{macro.val}<span className="text-xs text-[#D7D5D2]/20 align-top ml-1">g</span></div>
                            <div className="text-[9px] text-[#D7D5D2]/30 uppercase tracking-wider">Target: {macro.target}</div>

                            <div className={`absolute bottom-0 left-0 h-1 w-full opacity-20 ${macro.color}`}></div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Coach Insight */}
            <div className="bg-[#2D2D2D] border border-[#D7D5D2]/10 rounded-xl p-6 flex gap-4 items-start">
                <div className="bg-[#C8A871]/10 p-2 rounded-full">
                    <Sparkles className="w-5 h-5 text-[#C8A871]" />
                </div>
                <div>
                    <h4 className="text-[#F1EDE5] font-serif text-lg mb-1">Optimization Note</h4>
                    <p className="text-[#D7D5D2]/70 text-sm font-light leading-relaxed">
                        Your current goal is <strong>Recomposition</strong>. Focus on hitting your protein target early in the day to support recovery from today&apos;s Core Stability session.
                    </p>
                </div>
            </div>

        </div>
    );
}
