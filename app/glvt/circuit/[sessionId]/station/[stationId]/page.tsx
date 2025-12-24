"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Dumbbell, Clock } from "lucide-react";
import { glvtTheme } from "../../../../config/theme";

// MOCKED for demo visualization - In production this listens to `circuit_session` realtime events
const DEMO_EXERCISE = {
    name: "Goblet Squats",
    image: "/class-covers/glutes-workout.png",
    cues: ["Keep chest up", "Drive knees out", "Squeeze glutes at top"]
};

const NEXT_EXERCISE = {
    name: "Push Ups",
    image: "/class-covers/core-strength.png"
};

export default function StationDisplayPage({ params }: { params: { stationId: string } }) {
    const [phase, setPhase] = useState<"work" | "rest">("work");
    const [timer, setTimer] = useState(45);

    // Auto-loop demo
    useEffect(() => {
        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 0) {
                    setPhase(p => p === "work" ? "rest" : "work");
                    return p === "work" ? 15 : 45; // Switch duration based on NEXT phase
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const isRest = phase === "rest";

    return (
        <div className="h-screen w-screen overflow-hidden bg-black text-white relative flex flex-col">
            {/* Top Bar - Station ID & Timer */}
            <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-start">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#888] mb-1">Station</div>
                    <div className="text-4xl font-mono font-bold text-[#C8A871]">{params.stationId}</div>
                </div>

                {/* Big Timer */}
                <div
                    className={`rounded-2xl px-8 py-4 transition-colors duration-500 text-center ${isRest ? 'bg-blue-600/20 border-blue-500' : 'bg-[#C8A871]/10 border-[#C8A871]'
                        } border backdrop-blur-md`}
                >
                    <div className={`text-[10px] uppercase tracking-[0.2em] mb-1 ${isRest ? 'text-blue-400' : 'text-[#C8A871]'}`}>
                        {isRest ? "REST / ROTATE" : "WORK"}
                    </div>
                    <div className="text-6xl font-mono font-bold tabular-nums">
                        {timer}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            {isRest ? (
                // --- REST MODE UI ---
                <div className="flex-1 flex items-center justify-center bg-[#0E0E0E] relative">
                    <div className="text-center z-10 space-y-6 animate-in slide-in-from-right fade-in duration-500">
                        <div className="text-xl uppercase tracking-[0.3em] text-[#666]">Up Next</div>
                        <div className="relative w-[600px] h-[300px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl mx-auto">
                            <Image
                                src={NEXT_EXERCISE.image}
                                alt={NEXT_EXERCISE.name}
                                fill
                                className="object-cover opacity-60"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <h2 className="text-6xl font-serif text-white">{NEXT_EXERCISE.name}</h2>
                            </div>
                        </div>
                        <div className="text-2xl text-[#C8A871] animate-pulse">
                            Move to Station {parseInt(params.stationId) === 8 ? 1 : parseInt(params.stationId) + 1}
                        </div>
                    </div>
                </div>
            ) : (
                // --- WORK MODE UI ---
                <div className="flex-1 relative">
                    <Image
                        src={DEMO_EXERCISE.image}
                        alt={DEMO_EXERCISE.name}
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />

                    <div className="absolute bottom-0 left-0 p-12 max-w-2xl z-20">
                        <h1 className="text-7xl mb-6 font-serif leading-tight">{DEMO_EXERCISE.name}</h1>

                        <div className="space-y-4">
                            {DEMO_EXERCISE.cues.map((cue, i) => (
                                <div key={i} className="flex items-center gap-4 text-2xl text-[#D7D5D2]">
                                    <div className="w-2 h-2 rounded-full bg-[#C8A871]" />
                                    {cue}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Progress Line */}
            <div className="h-2 bg-[#1a1a1a] w-full">
                <div
                    className={`h-full transition-all duration-1000 ease-linear ${isRest ? 'bg-blue-500' : 'bg-[#C8A871]'}`}
                    style={{ width: `${(timer / (isRest ? 15 : 45)) * 100}%` }}
                />
            </div>
        </div>
    );
}
