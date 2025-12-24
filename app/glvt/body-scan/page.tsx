"use client";

import { ChevronLeft, Info, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import "./mobile.css";

const MOCK_SCAN = {
    date: "Dec 15, 2024",
    weight: { val: 76.5, unit: "kg", delta: -0.5 },
    pbf: { val: 18.2, unit: "%", delta: -0.8 }, // Percent Body Fat
    smm: { val: 38.4, unit: "kg", delta: +0.2 }, // Skeletal Muscle Mass
    score: 82,
    details: [
        { label: "BMI", val: 23.4, status: "Normal" },
        { label: "Visceral Fat", val: 4, status: "Healthy" },
        { label: "BMR", val: 1640, unit: "kcal" }
    ]
};

export default function BodyScanPage() {
    return (
        <div className="min-h-screen bg-[#111] text-white p-6 flex flex-col">
            {/* Header */}
            <div className="flex items-center mb-6">
                <Link href="/glvt/home" className="mr-4">
                    <ChevronLeft className="w-6 h-6 text-gray-400" />
                </Link>
                <span className="text-xs uppercase tracking-[0.2em] text-gray-500">Body Scan</span>
            </div>

            {/* 3D Model Placeholder */}
            <div className="flex-1 flex items-center justify-center relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#111]/50 to-[#111] z-10 pointer-events-none"></div>
                {/*  In a real app, this would be a Three.js canvas or an image from the scanner API */}
                <div className="h-[400px] w-[200px] bg-gray-800 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="text-center z-0 relative">
                    <div className="text-[200px] leading-none opacity-10 font-bold select-none">3D</div>
                </div>

                {/* Floating Metrics */}
                <div className="absolute top-10 left-0 bg-black/40 backdrop-blur border border-white/10 p-3 rounded-lg">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Weight</div>
                    <div className="text-xl font-mono">{MOCK_SCAN.weight.val}<span className="text-sm text-gray-500">{MOCK_SCAN.weight.unit}</span></div>
                    <div className="text-[10px] text-emerald-400 flex items-center"><TrendingDown className="w-3 h-3 mr-1" /> {Math.abs(MOCK_SCAN.weight.delta)}</div>
                </div>

                <div className="absolute top-20 right-0 bg-black/40 backdrop-blur border border-white/10 p-3 rounded-lg text-right">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Body Fat</div>
                    <div className="text-xl font-mono">{MOCK_SCAN.pbf.val}<span className="text-sm text-gray-500">{MOCK_SCAN.pbf.unit}</span></div>
                    <div className="text-[10px] text-emerald-400 flex items-center justify-end"><TrendingDown className="w-3 h-3 mr-1" /> {Math.abs(MOCK_SCAN.pbf.delta)}</div>
                </div>
            </div>

            {/* Scan Score */}
            <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 mb-6 flex items-center justify-between">
                <div>
                    <h3 className="font-serif text-lg">VisBody Score</h3>
                    <p className="text-xs text-gray-400">Scan from {MOCK_SCAN.date}</p>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center text-lg font-bold text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    {MOCK_SCAN.score}
                </div>
            </div>

            {/* Detailed Grid */}
            <div className="grid grid-cols-2 gap-3">
                {MOCK_SCAN.details.map(d => (
                    <div key={d.label} className="bg-[#1a1a1a] border border-white/5 p-3 rounded-lg">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{d.label}</div>
                        <div className="text-lg font-mono">
                            {d.val} <span className="text-xs text-gray-600">{d.unit}</span>
                        </div>
                    </div>
                ))}
                <Link href="/glvt/nutrition" className="bg-[#1a1a1a] border border-white/5 p-3 rounded-lg flex flex-col justify-center items-center text-gray-400 hover:text-white hover:border-emerald-500/50 transition-colors">
                    <Info className="w-5 h-5 mb-1" />
                    <span className="text-[10px] uppercase tracking-widest text-center">Nutrition Targets</span>
                </Link>
            </div>

        </div>
    );
}
