"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Save, History } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GLVT_THEME, commonStyles } from "../theme";
import {
    submitLoggedWorkout,
    getLoggedExercisesHistory,
    type LoggedExerciseInput
} from "@/lib/services/exequteMpApi";

// Temporary Mock for Development until we have a real booking flow
const MOCK_BOOKING_WORKOUT = {
    id: "workout-123",
    exercises_workouts: {
        "block-a": [
            { id: "ex-1", name: "Squats", type: "Lower Body", unit: "kg" },
            { id: "ex-2", name: "Push Ups", type: "Upper Body", unit: "reps" },
            { id: "ex-3", name: "Plank", type: "Core", unit: "sec" }
        ]
    }
};

export default function FitnessTestPage() {
    const searchParams = useSearchParams();
    const bookingId = searchParams?.get('bookingId');

    const [exercises, setExercises] = useState<any[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [inputs, setInputs] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    // Load Workout Data
    useEffect(() => {
        // In real app, fetch booking by ID here. 
        // For now, use mock structure that matches MP
        // const booking = await getBookingWithLoggedWorkout(bookingId);
        const booking = MOCK_BOOKING_WORKOUT;

        if (booking && booking.exercises_workouts['block-a']) {
            setExercises(booking.exercises_workouts['block-a']);
        }
    }, [bookingId]);

    const activeEx = exercises[currentIdx];

    // Load History for Active Exercise
    useEffect(() => {
        if (activeEx) {
            // getLoggedExercisesHistory(activeEx.id).then(setHistory).catch(console.error);
        }
    }, [activeEx]);

    const handleInput = (key: string, val: string) => {
        if (!activeEx) return;
        setInputs(prev => ({
            ...prev,
            [activeEx.id]: { ...prev[activeEx.id], id: activeEx.id, [key]: val }
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Convert inputs map to array for API
            const payload: LoggedExerciseInput[] = Object.values(inputs);
            await submitLoggedWorkout(MOCK_BOOKING_WORKOUT.id, payload);
            alert("Workout Submitted Successfully!");
            // Redirect or show success state
        } catch (e: any) {
            console.error(e);
            alert("Failed to submit: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const next = () => setCurrentIdx(prev => Math.min(prev + 1, exercises.length - 1));
    const prev = () => setCurrentIdx(prev => Math.max(prev - 1, 0));

    if (!activeEx) return <div className="p-8 text-white">Loading Assessment...</div>;

    return (
        <div className={`min-h-screen flex flex-col ${commonStyles.pageContainer}`} style={{ fontFamily: GLVT_THEME.fonts.sans }}>

            {/* Header */}
            <header className="px-6 py-6 flex items-center justify-between z-10 sticky top-0 bg-[#2D2D2D]/90 backdrop-blur-md border-b border-[#D7D5D2]/5">
                <Link href="/glvt/home" className="flex items-center text-[#D7D5D2]/60 hover:text-[#C8A871] transition-colors">
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    <span className="text-[10px] uppercase tracking-[0.15em] font-medium">Exit</span>
                </Link>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C8A871] font-bold">Assessment</div>
                <div className="w-6"></div>
            </header>

            <main className="flex-1 px-6 py-8 flex flex-col justify-between max-w-md mx-auto w-full">

                <div className="relative">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#D7D5D2]/40 mb-2 flex justify-between">
                        <span>Exercise {currentIdx + 1} of {exercises.length}</span>
                        <span>{activeEx.type}</span>
                    </div>

                    <h2 className="text-4xl text-[#F1EDE5] mb-6 leading-tight" style={{ fontFamily: 'serif' }}>
                        {activeEx.name}
                    </h2>

                    {/* Past Performance Hint (Mocked for now) */}
                    <div className="inline-flex items-center gap-4 px-4 py-3 bg-[#3a3a3a] border border-[#D7D5D2]/10 rounded-xl mb-8">
                        <History className="w-4 h-4 text-[#C8A871]" />
                        <div className="flex gap-4">
                            <span className="text-sm text-[#D7D5D2]/60">No recent history</span>
                        </div>
                    </div>
                </div>

                {/* Input Area */}
                <div className="space-y-8 mb-8">
                    <div className="bg-[#3a3a3a] p-6 rounded-2xl border border-[#D7D5D2]/5 shadow-inner">
                        <label className="text-[10px] uppercase text-[#C8A871] tracking-[0.2em] font-bold block mb-4">Log Result</label>

                        <div className="flex gap-4">
                            {/* Dynamic inputs based on unit type could go here, for now standardized */}
                            <div className="flex-1">
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full bg-transparent border-b border-[#D7D5D2]/20 py-2 text-3xl font-serif text-[#F1EDE5] placeholder-[#D7D5D2]/10 focus:outline-none focus:border-[#C8A871] transition-colors"
                                        value={inputs[activeEx.id]?.amount || ''}
                                        onChange={e => handleInput('amount', e.target.value)}
                                    />
                                    <span className="absolute right-0 bottom-4 text-[10px] text-[#D7D5D2]/40 uppercase tracking-wider">{activeEx.unit || 'Units'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                    {currentIdx < exercises.length - 1 ? (
                        <button
                            onClick={next}
                            className={commonStyles.buttonPrimary}
                        >
                            Next Exercise <ChevronRight className="w-4 h-4 ml-2 inline-block" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className={commonStyles.buttonPrimary}
                        >
                            {loading ? "Submitting..." : <><Save className="w-4 h-4 mr-2 inline-block" /> Complete Assessment</>}
                        </button>
                    )}

                    {currentIdx > 0 && (
                        <button
                            onClick={prev}
                            className="w-full py-4 text-[10px] uppercase tracking-[0.15em] text-[#D7D5D2]/40 hover:text-[#F1EDE5] transition-colors"
                        >
                            Previous Step
                        </button>
                    )}
                </div>

            </main>
        </div>
    );
}
