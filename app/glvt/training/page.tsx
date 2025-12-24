"use client";

import { useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GLVT_THEME, commonStyles } from "../theme";

// Import Components
import WorkoutsDashboard from "./components/WorkoutsDashboard";
import MetricsDashboard from "./components/MetricsDashboard";
import DevicesDashboard from "./components/DevicesDashboard";
import NutritionTargets from "@/app/glvt/nutrition/page";

export default function TrainingHubPage() {
    const [activeTab, setActiveTab] = useState("workouts");

    return (
        <div className={`min-h-screen flex flex-col ${commonStyles.pageContainer}`} style={{ fontFamily: GLVT_THEME.fonts.sans }}>

            {/* Header - Matches Booking Page Header */}
            <div className="px-6 py-6 border-b border-[#D7D5D2]/5 bg-[#2D2D2D] sticky top-0 z-30">
                <div className="flex items-center justify-between mb-2">
                    <Link href="/glvt/home" className="flex items-center text-[#D7D5D2]/60 hover:text-[#C8A871] transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-1" />
                        <span className="text-[10px] uppercase tracking-[0.15em] font-medium">Back</span>
                    </Link>
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl text-[#F1EDE5] leading-tight" style={{ fontFamily: 'serif' }}>Training Hub</h1>
                        <p className="text-xs text-[#D7D5D2]/60 uppercase tracking-wider font-medium mt-1">Holistic Body Management</p>
                    </div>
                </div>
            </div>

            <div className="px-6 py-6 max-w-lg mx-auto md:max-w-4xl w-full">

                {/* Progress Card Removed - Moved to 'Active Program' inside WorkoutsDashboard for better hierarchy */}

                {/* Main Tabs Navigation - Restyled to match "Filter Chips" from Booking */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">

                    <div className="overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar scrollbar-hide">
                        <TabsList className="bg-transparent h-auto p-0 w-full justify-start gap-3">
                            <TabsTrigger
                                value="workouts"
                                className="rounded-full border border-[#D7D5D2]/15 bg-[#3a3a3a] text-[#D7D5D2]/60 px-6 py-3 text-[10px] uppercase tracking-[0.1em] font-medium data-[state=active]:bg-[#C8A871] data-[state=active]:text-[#2D2D2D] data-[state=active]:border-[#C8A871] data-[state=active]:font-bold transition-all shadow-sm min-w-fit"
                            >
                                Programs
                            </TabsTrigger>

                            <TabsTrigger
                                value="metrics"
                                className="rounded-full border border-[#D7D5D2]/15 bg-[#3a3a3a] text-[#D7D5D2]/60 px-6 py-3 text-[10px] uppercase tracking-[0.1em] font-medium data-[state=active]:bg-[#C8A871] data-[state=active]:text-[#2D2D2D] data-[state=active]:border-[#C8A871] data-[state=active]:font-bold transition-all shadow-sm min-w-fit"
                            >
                                Metrics
                            </TabsTrigger>

                            <TabsTrigger
                                value="devices"
                                className="rounded-full border border-[#D7D5D2]/15 bg-[#3a3a3a] text-[#D7D5D2]/60 px-6 py-3 text-[10px] uppercase tracking-[0.1em] font-medium data-[state=active]:bg-[#C8A871] data-[state=active]:text-[#2D2D2D] data-[state=active]:border-[#C8A871] data-[state=active]:font-bold transition-all shadow-sm min-w-fit"
                            >
                                Devices
                            </TabsTrigger>

                            <TabsTrigger
                                value="plan"
                                className="rounded-full border border-[#D7D5D2]/15 bg-[#3a3a3a] text-[#D7D5D2]/60 px-6 py-3 text-[10px] uppercase tracking-[0.1em] font-medium data-[state=active]:bg-[#C8A871] data-[state=active]:text-[#2D2D2D] data-[state=active]:border-[#C8A871] data-[state=active]:font-bold transition-all shadow-sm min-w-fit"
                            >
                                Strategy
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="workouts" className="mt-0 focus:outline-none">
                        <WorkoutsDashboard />
                    </TabsContent>

                    <TabsContent value="metrics" className="mt-0 focus:outline-none">
                        <MetricsDashboard />
                    </TabsContent>

                    {/* Nutrition Removed - Now separate feature from Home */}

                    <TabsContent value="plan" className="mt-0 focus:outline-none">
                        <div className="bg-[#3a3a3a] border border-[#D7D5D2]/15 rounded-2xl p-1 overflow-hidden">
                            <NutritionTargets />
                        </div>
                    </TabsContent>

                    <TabsContent value="devices" className="mt-0 focus:outline-none">
                        <DevicesDashboard />
                    </TabsContent>

                </Tabs>

            </div>
        </div>
    );
}
