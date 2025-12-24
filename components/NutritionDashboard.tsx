
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Apple, Flame, Zap, Plus, ArrowLeft, Info, ChevronDown, Dumbbell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ResponsiveContainer, RadialBarChart, RadialBar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TDEECalculator } from "./nutrition/TDEECalculator";
import { FoodLogger } from "./nutrition/FoodLogger";
import { RecipeDesigner } from "./nutrition/RecipeDesigner";
import { WhoopConnect } from "./integrations/WhoopConnect";
import { BottomNav } from "./dashboard/BottomNav";
import { FacilityView } from "@/app/glvt/_components/views/FacilityView";
import { nutritionService } from "@/lib/services/nutritionService";

interface NutritionStats {
    consumed: number;
    burned: number;
    tdee: number;
    bmr: number;
    targetCalories: number;
    deficit: number;
    proteinConsumed: number;
    proteinTarget: number;
    carbsConsumed: number;
    carbsTarget: number;
    fatConsumed: number;
    fatTarget: number;
}

export default function NutritionDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<NutritionStats | null>(null);
    const [activeView, setActiveView] = useState<'dashboard' | 'log' | 'recipes' | 'settings' | 'integrations' | 'workouts' | 'profile'>('dashboard');

    useEffect(() => {
        loadNutritionData();
    }, [activeView]);

    const loadNutritionData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Mock Data to match screenshot
                setStats({
                    consumed: 0,
                    burned: 3275, // implied from deficit
                    tdee: 3275,
                    bmr: 1898,
                    targetCalories: 4375, // from screenshot
                    deficit: 3275, // 0 - 3275 approx? Screenshot says 3275 deficit with 0 consumed.
                    proteinConsumed: 0,
                    proteinTarget: 202,
                    carbsConsumed: 0,
                    carbsTarget: 726,
                    fatConsumed: 0,
                    fatTarget: 74,
                });
                setLoading(false);
                return;
            }

            const profile = await nutritionService.getProfile();
            const foodLogs = await nutritionService.getDailyLogs(new Date());

            const tdee = Number(profile?.calculated_tdee || 2400);
            const bmr = Number(profile?.calculated_bmr || 1850);
            const targetCalories = Number(profile?.target_calories || 2200);

            const consumed = foodLogs?.reduce((sum, log) => sum + Number(log.calories || 0), 0) || 0;
            const proteinConsumed = foodLogs?.reduce((sum, log) => sum + Number(log.protein_g || 0), 0) || 0;
            const carbsConsumed = foodLogs?.reduce((sum, log) => sum + Number(log.carbs_g || 0), 0) || 0;
            const fatConsumed = foodLogs?.reduce((sum, log) => sum + Number(log.fat_g || 0), 0) || 0;

            // Mock burned (TDEE + simple activity factor)
            const burned = tdee;

            setStats({
                consumed,
                burned,
                tdee,
                bmr,
                targetCalories,
                deficit: burned - consumed,
                proteinConsumed,
                proteinTarget: Number(profile?.target_protein_g || 180),
                carbsConsumed,
                carbsTarget: Number(profile?.target_carbs_g || 250),
                fatConsumed,
                fatTarget: Number(profile?.target_fat_g || 70),
            });

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!stats && !loading) return null;

    // Chart Data
    const calorieProgress = stats ? (stats.consumed / stats.targetCalories) * 100 : 0;
    const radialData = [{
        name: 'Calories',
        value: calorieProgress > 100 ? 100 : calorieProgress,
        fill: '#34D399',
    }];

    const renderDashboard = () => (
        <div className="space-y-6 pb-24">
            {/* Mobile Header */}
            <div className="flex justify-between items-center bg-[#1A1A1A] p-6 rounded-xl border border-[#333]">
                <div>
                    <h2 className="text-xl font-bold text-white">Today</h2>
                    <p className="text-gray-400 text-sm">Summary</p>
                </div>
                {/* Quick Add Button */}
                <Button size="sm" className="bg-[#34D399] hover:bg-[#10B981] text-black font-semibold h-8" onClick={() => setActiveView('log')}>
                    <Plus className="w-4 h-4 mr-1" /> Log
                </Button>
            </div>

            {/* Main Stats Card - Daily Energy */}
            <Card className="bg-[#1A1A1A] border-[#333] text-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><Flame className="w-4 h-4 text-[#34D399]" /> Daily Energy</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-2">
                    <div className="h-40 w-full relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
                                <RadialBar background={{ fill: '#333' }} dataKey="value" cornerRadius={10} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-white">{stats?.consumed}</span>
                            <span className="text-xs text-gray-400">/ {stats?.targetCalories} kcal</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Macros - Linear Progress */}
            <Card className="bg-[#1A1A1A] border-[#333] text-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><Apple className="w-4 h-4 text-[#34D399]" /> Macros</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#3b82f6]">Protein</span>
                            <span className="text-gray-400">{stats?.proteinConsumed} / {stats?.proteinTarget}g</span>
                        </div>
                        <Progress value={(stats?.proteinConsumed || 0) / (stats?.proteinTarget || 1) * 100} className="h-1.5 bg-[#333]" indicatorClassName="bg-[#3b82f6]" />
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#f97316]">Carbs</span>
                            <span className="text-gray-400">{stats?.carbsConsumed} / {stats?.carbsTarget}g</span>
                        </div>
                        <Progress value={(stats?.carbsConsumed || 0) / (stats?.carbsTarget || 1) * 100} className="h-1.5 bg-[#333]" indicatorClassName="bg-[#f97316]" />
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#eab308]">Fat</span>
                            <span className="text-gray-400">{stats?.fatConsumed} / {stats?.fatTarget}g</span>
                        </div>
                        <Progress value={(stats?.fatConsumed || 0) / (stats?.fatTarget || 1) * 100} className="h-1.5 bg-[#333]" indicatorClassName="bg-[#eab308]" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderContent = () => {
        switch (activeView) {
            case 'log':
                return <FoodLogger onLogComplete={() => { loadNutritionData(); setActiveView('dashboard'); }} />;
            case 'recipes':
                return <RecipeDesigner onComplete={() => setActiveView('dashboard')} />;
            case 'settings':
            case 'profile':
                return <TDEECalculator onComplete={() => { loadNutritionData(); setActiveView('dashboard'); }} />;
            case 'integrations':
                return <WhoopConnect />;
            case 'workouts':
                return <FacilityView />;
            case 'dashboard':
            default:
                return renderDashboard();
        }
    };

    return (
        <div className="min-h-screen bg-black font-sans text-foreground">
            {/* Main Content Area - no padding here, padding is inside components */}
            <div className="p-4 safe-area-top">
                {renderContent()}
            </div>

            {/* Bottom Navigation spacer to prevent content being hidden */}
            <div className="h-24" />

            {/* Fixed Bottom Navigation */}
            <BottomNav activeView={activeView === 'settings' ? 'profile' : activeView} onNavigate={(view) => setActiveView(view as any)} />
        </div>
    );
}
