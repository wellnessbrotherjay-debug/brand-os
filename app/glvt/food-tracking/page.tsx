"use client";

import NutritionDashboard from "@/components/NutritionDashboard";

export default function FoodTrackingPage() {
    return (
        <div className="min-h-screen bg-background p-6 md:p-12 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <NutritionDashboard />
            </div>
        </div>
    );
}

