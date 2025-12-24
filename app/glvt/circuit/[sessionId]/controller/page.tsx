"use client";

import { useState, useEffect } from "react";
import { Play, Pause, FastForward, Activity, Users, Monitor } from "lucide-react";
import { glvtTheme } from "../../../config/theme";
import { circuitService } from "@/lib/services/circuitService";

export default function CircuitControllerPage({ params }: { params: { sessionId: string } }) {
    const [status, setStatus] = useState("setup"); // setup, active, paused
    const [phase, setPhase] = useState("warmup"); // warmup, work, rest
    const [timer, setTimer] = useState(45); // Countdown

    // Mock connected devices for demo visual
    const [devices, setDevices] = useState([
        { id: 1, type: "tablet", status: "online" },
        { id: 2, type: "tablet", status: "online" },
        { id: 3, type: "tablet", status: "offline" },
        { id: 9, type: "tv", status: "online" }
    ]);

    const handleStart = () => {
        setStatus("active");
        setPhase("work");
        // In real app: circuitService.startCircuit(params.sessionId);
    };

    const handlePause = () => {
        setStatus("paused");
        // circuitService.pauseCircuit(params.sessionId);
    };

    const handleNextPhase = () => {
        const next = phase === "work" ? "rest" : "work";
        setPhase(next);
        setTimer(next === "work" ? 45 : 15);
        // circuitService.nextPhase(params.sessionId, next);
    };

    return (
        <div className="min-h-screen bg-[#0E0E0E] text-[#F1EDE5] flex flex-col font-sans">
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-[#161616] flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#C8A871]" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[#C8A871]">Live Controller</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider opacity-60">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    broadcasting
                </div>
            </div>

            {/* Main Timer Display */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center transition-colors duration-500"
                style={{ backgroundColor: phase === 'work' ? '#0E0E0E' : '#1a1a1a' }}
            >
                <div className="mb-4">
                    <span
                        className={`text-xs uppercase tracking-[0.3em] font-bold px-3 py-1 rounded-full border ${phase === 'work' ? 'border-[#C8A871] text-[#C8A871]' : 'border-blue-400 text-blue-400'
                            }`}
                    >
                        {phase} Period
                    </span>
                </div>

                <div className="text-[120px] leading-none font-mono font-bold tabular-nums mb-8">
                    {timer}
                    <span className="text-xl text-[#666]">s</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-xs h-1 bg-[#242424] rounded-full overflow-hidden mb-12">
                    <div
                        className={`h-full transition-all duration-1000 ${phase === 'work' ? 'bg-[#C8A871]' : 'bg-blue-500'}`}
                        style={{ width: `${(timer / 45) * 100}%` }}
                    />
                </div>

                {/* Main Controls */}
                <div className="flex items-center gap-6">
                    {status === "active" ? (
                        <button
                            onClick={handlePause}
                            className="w-20 h-20 rounded-full bg-[#242424] text-white flex items-center justify-center border border-white/10 hover:bg-[#333]"
                        >
                            <Pause className="w-8 h-8" fill="currentColor" />
                        </button>
                    ) : (
                        <button
                            onClick={handleStart}
                            className="w-24 h-24 rounded-full bg-[#C8A871] text-[#0E0E0E] flex items-center justify-center shadow-[0_0_40px_rgba(200,168,113,0.3)] hover:scale-105 transition-transform"
                        >
                            <Play className="w-10 h-10 ml-1" fill="currentColor" />
                        </button>
                    )}

                    <button
                        onClick={handleNextPhase}
                        className="w-20 h-20 rounded-full bg-[#242424] text-white flex items-center justify-center border border-white/10 hover:bg-[#333]"
                    >
                        <FastForward className="w-8 h-8" />
                    </button>
                </div>
            </div>

            {/* Device Grid */}
            <div className="p-6 bg-[#111] border-t border-white/5">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#666] font-bold">Connected Stations</h3>
                    <span className="text-[10px] text-[#444]">{devices.filter(d => d.status === 'online').length} online</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(st => {
                        const dev = devices.find(d => d.id === st);
                        const isOnline = dev?.status === 'online';
                        return (
                            <div
                                key={st}
                                className={`h-12 rounded-lg border flex items-center justify-center font-mono text-xs ${isOnline ? 'border-[#C8A871]/30 bg-[#C8A871]/5' : 'border-[#333] bg-[#1a1a1a] opacity-50'
                                    }`}
                            >
                                {st}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
