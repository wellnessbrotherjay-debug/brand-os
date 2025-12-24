"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Search, Plus, Flame, PieChart } from "lucide-react";
import Link from "next/link";
import { glvtTheme } from "../config/theme";
import { nutritionService } from "@/lib/services/nutritionService";
import FoodSearchModal from "./_components/FoodSearchModal";

export default function NutritionPage() {
    const [loading, setLoading] = useState(true);
    const [dailyLog, setDailyLog] = useState<any>(null);
    const [today] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        loadDailyLog();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [today]);

    const loadDailyLog = async () => {
        try {
            // Mock userId
            const data = await nutritionService.getCreateDailyLog(today, "mock-user-id");
            setDailyLog(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        const results = await nutritionService.searchFood(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
    };

    const addFood = async (food: any) => {
        try {
            await nutritionService.logFood("mock-user-id", today, "snack", {
                name: food.name,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fats: food.fats,
                fdcId: food.fdcId
            });
            // Reload vals
            loadDailyLog();
            setSearchResults([]);
            setSearchQuery("");
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div
            className="min-h-screen p-6 flex flex-col font-sans max-w-md mx-auto relative"
            style={{ backgroundColor: "#1C1C1E", color: "#F1EDE5" }}
        >
            {/* Header */}
            <header className="relative flex items-start justify-between mb-8 pt-4">
                <Link href="/glvt/home" className="p-2 -ml-2 text-white">
                    <ChevronLeft className="w-6 h-6" />
                </Link>

                <div className="flex-1 px-4">
                    <h1 className="text-3xl text-[#F1EDE5] leading-none mb-1" style={{ fontFamily: "Georgia, serif" }}>
                        Nutrition<br />Log
                    </h1>
                    <div className="text-[10px] font-bold tracking-[0.2em] text-[#C8A871] uppercase">
                        Thursday, Dec 18
                    </div>
                </div>

                <button className="px-3 py-1.5 rounded border border-white/20 text-[9px] font-bold tracking-widest uppercase text-white hover:bg-white/5 transition-colors">
                    View Targets
                </button>
            </header>

            {/* Macro Cards */}
            <div className="grid grid-cols-4 gap-2 mb-10">
                {[
                    { label: "Cal", current: dailyLog?.total_calories || 0, target: 2500, unit: "" },
                    { label: "Protein", current: dailyLog?.total_protein_g || 0, target: 200, unit: "g" },
                    { label: "Carbs", current: dailyLog?.total_carbs_g || 0, target: 250, unit: "g" },
                    { label: "Fat", current: dailyLog?.total_fats_g || 0, target: 65, unit: "g" }
                ].map((macro, i) => (
                    <div key={macro.label} className="bg-[#2C2C2E] rounded-2xl p-3 flex flex-col items-center justify-between text-center border border-white/5 aspect-[3/5]">
                        <span className="text-[9px] font-bold tracking-wider text-[#888] uppercase">{macro.label}</span>

                        <div className="flex flex-col items-center gap-1 my-2">
                            <span className="text-xl font-serif text-white">{macro.current}<span className="text-[10px] font-sans ml-0.5">{macro.unit}</span></span>
                            <div className="w-full h-px bg-white/10" />
                            <span className="text-[10px] text-[#666]">{macro.target}</span>
                        </div>

                        <div className="w-full h-1 bg-[#444] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#C8A871]"
                                style={{ width: `${Math.min((macro.current / macro.target) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Daily Journal */}
            <div className="flex-1">
                <h3 className="text-[10px] font-bold tracking+[0.2em] text-[#666] uppercase mb-4">Daily Journal</h3>

                {/* Meal Sections */}
                {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((meal) => (
                    <div key={meal} className="mb-4 bg-[#2C2C2E] rounded-2xl p-5 border border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-serif text-[#F1EDE5]">{meal}</h4>
                            <button className="flex items-center gap-1 text-[9px] font-bold tracking-widest text-[#C8A871] uppercase hover:text-white transition-colors">
                                <Plus className="w-3 h-3" /> Add Item
                            </button>
                        </div>

                        <div className="p-6 rounded-xl border border-white/5 border-dashed bg-[#242426] flex items-center justify-center">
                            <span className="text-xs font-bold text-[#444]">Empty Log</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search Overlay (Hidden by default in this design iteration unless active) */}
            {/* We can re-integrate the search as a modal or bottom sheet later to keep this view clean */}
        </div>
    );
}
