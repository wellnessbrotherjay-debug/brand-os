"use client";

import { useState } from "react";
import { X, Search, Plus, Loader2 } from "lucide-react";
import { nutritionService } from "@/lib/services/nutritionService";

interface FoodSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    mealType: string;
    onFoodAdded: () => void;
}

export default function FoodSearchModal({ isOpen, onClose, mealType, onFoodAdded }: FoodSearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [addingIds, setAddingIds] = useState<Record<string, boolean>>({});

    if (!isOpen) return null;

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const data = await nutritionService.searchFood(query);
            setResults(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (food: any) => {
        setAddingIds(prev => ({ ...prev, [food.fdcId || food.name]: true }));
        try {
            // Mock user ID for now
            const today = new Date().toISOString().split('T')[0];
            await nutritionService.logFood("mock-user-id", today, mealType.toLowerCase() as any, {
                name: food.name,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fats: food.fats,
                fdcId: food.fdcId
            });
            onFoodAdded();
            onClose(); // Optional: Close on add, or keep open to add more
            // For better UX, maybe keep open and show toast? 
            // For now, closing to return to main view as per "clean" flow.
        } catch (e) {
            console.error(e);
        } finally {
            setAddingIds(prev => ({ ...prev, [food.fdcId || food.name]: false }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full h-[90vh] sm:h-[600px] sm:max-w-md bg-[#1C1C1E] sm:rounded-2xl rounded-t-2xl flex flex-col border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h2 className="text-lg font-serif text-[#F1EDE5]">Add to {mealType}</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-[#888] hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-white/5">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Search (e.g. Avocado Toast)"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-[#2C2C2E] text-white rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-1 focus:ring-[#C8A871] placeholder-[#444]"
                        />
                    </form>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading && (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-6 h-6 text-[#C8A871] animate-spin" />
                        </div>
                    )}

                    {!loading && results.length === 0 && query && (
                        <div className="text-center py-10 text-[#444] text-xs">No foods found.</div>
                    )}

                    {results.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-[#242426] rounded-xl border border-white/5">
                            <div>
                                <div className="font-bold text-[#F1EDE5] text-sm">{item.name}</div>
                                {item.brand && <div className="text-[10px] text-[#888]">{item.brand}</div>}
                                <div className="text-[10px] text-[#666] mt-1">
                                    {item.calories} kcal • {item.protein}p • {item.carbs}c • {item.fats}f
                                </div>
                            </div>
                            <button
                                onClick={() => handleAdd(item)}
                                disabled={addingIds[item.fdcId || item.name]}
                                className="w-8 h-8 rounded-full bg-[#C8A871] flex items-center justify-center text-[#0E0E0E] hover:bg-white transition-colors disabled:opacity-50"
                            >
                                {addingIds[item.fdcId || item.name] ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
