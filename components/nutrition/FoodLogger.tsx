
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ScanLine, X } from "lucide-react";
import { nutritionService } from "@/lib/services/nutritionService";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FoodLoggerProps {
    onLogComplete: () => void;
    isOpen?: boolean; // Optional if we want to control visibility from parent
    onClose?: () => void;
}

export function FoodLogger({ onLogComplete, onClose }: FoodLoggerProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("search");
    const [mealType, setMealType] = useState("Dinner");
    const [searchQuery, setSearchQuery] = useState("");

    // Manual Entry State
    const [manualEntry, setManualEntry] = useState({
        name: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
    });

    const handleManualLog = async () => {
        if (!manualEntry.name || !manualEntry.calories) {
            toast.error("Name and Calories are required");
            return;
        }

        setLoading(true);
        try {
            await nutritionService.logFood({
                meal_name: manualEntry.name,
                meal_type: mealType,
                calories: Number(manualEntry.calories),
                protein_g: Number(manualEntry.protein),
                carbs_g: Number(manualEntry.carbs),
                fat_g: Number(manualEntry.fat),
            });
            toast.success("Food logged successfully!");
            onLogComplete();
        } catch (error) {
            console.error(error);
            toast.error("Failed to log food");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        // TODO: Implement actual food search API
        toast.info(`Searching for "${searchQuery}"... (Mock)`);
    };

    return (
        <Card className="max-w-md mx-auto bg-[#1A1A1A] border-[#333] text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl">Log a Meal</CardTitle>
                    <CardDescription className="text-gray-400">Search for food or enter manually</CardDescription>
                </div>
                {onClose && (
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-400 hover:text-white">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-gray-400 text-xs uppercase tracking-wider">Meal Type</Label>
                    <Select value={mealType} onValueChange={setMealType}>
                        <SelectTrigger className="bg-[#262626] border-[#404040] text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#262626] border-[#404040] text-white">
                            <SelectItem value="Breakfast">Breakfast</SelectItem>
                            <SelectItem value="Lunch">Lunch</SelectItem>
                            <SelectItem value="Dinner">Dinner</SelectItem>
                            <SelectItem value="Snack">Snack</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-[#262626]">
                        <TabsTrigger value="search" className="data-[state=active]:bg-[#333] data-[state=active]:text-white">Search / Scan</TabsTrigger>
                        <TabsTrigger value="manual" className="data-[state=active]:bg-[#333] data-[state=active]:text-white">Manual Entry</TabsTrigger>
                    </TabsList>

                    <TabsContent value="search" className="space-y-4 pt-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search for food (e.g., chicken breast...)"
                                    className="pl-9 bg-[#262626] border-[#404040] text-white placeholder:text-gray-500"
                                    value={searchQuery}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleSearch} className="bg-[#34D399] hover:bg-[#10B981] text-black font-medium">
                                Search
                            </Button>
                        </div>

                        <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-[#333] rounded-lg">
                            <ScanLine className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Or scan a barcode (Coming Soon)</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="manual" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Food Name</Label>
                            <Input
                                placeholder="e.g. Grilled Chicken Salad"
                                className="bg-[#262626] border-[#404040]"
                                value={manualEntry.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualEntry({ ...manualEntry, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Calories</Label>
                                <Input
                                    type="number"
                                    placeholder="kcal"
                                    className="bg-[#262626] border-[#404040]"
                                    value={manualEntry.calories}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualEntry({ ...manualEntry, calories: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Protein (g)</Label>
                                <Input
                                    type="number"
                                    className="bg-[#262626] border-[#404040]"
                                    value={manualEntry.protein}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualEntry({ ...manualEntry, protein: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Carbs (g)</Label>
                                <Input
                                    type="number"
                                    className="bg-[#262626] border-[#404040]"
                                    value={manualEntry.carbs}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualEntry({ ...manualEntry, carbs: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Fat (g)</Label>
                                <Input
                                    type="number"
                                    className="bg-[#262626] border-[#404040]"
                                    value={manualEntry.fat}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualEntry({ ...manualEntry, fat: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button className="w-full bg-[#34D399] hover:bg-[#10B981] text-black font-medium" onClick={handleManualLog} disabled={loading}>
                            {loading ? "Logging..." : "Log Manual Entry"}
                        </Button>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
