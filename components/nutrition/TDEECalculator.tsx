
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { nutritionService } from "@/lib/services/nutritionService";
import { toast } from "sonner";

interface TDEECalculatorProps {
    onComplete: () => void;
}

export function TDEECalculator({ onComplete }: TDEECalculatorProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        sex: "F",
        age: "",
        weight: "",
        height: "",
        activity_level: "moderate",
        goal: "lose",
        goal_rate_kg_per_week: 0.5,
    });

    const calculateTDEE = (bmr: number, activity: string) => {
        const multipliers: Record<string, number> = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            very_active: 1.725,
            extra_active: 1.9,
        };
        return bmr * (multipliers[activity] || 1.2);
    };

    const calculateBMR = (
        weight: number,
        height: number,
        age: number,
        sex: string
    ) => {
        // Mifflin-St Jeor Equation
        if (sex === "M") {
            return 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            return 10 * weight + 6.25 * height - 5 * age - 161;
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const weight = parseFloat(formData.weight);
            const height = parseFloat(formData.height);
            const age = parseFloat(formData.age);

            if (!weight || !height || !age) {
                toast.error("Please enter valid metrics");
                setLoading(false);
                return;
            }

            const bmr = calculateBMR(weight, height, age, formData.sex);
            const tdee = calculateTDEE(bmr, formData.activity_level);

            // Simple Goal Calculation
            let targetCalories = tdee;
            if (formData.goal === "lose") {
                targetCalories -= 500 * (formData.goal_rate_kg_per_week / 0.5); // 500cal deficit per ~0.5kg/week
            } else if (formData.goal === "gain") {
                targetCalories += 500 * (formData.goal_rate_kg_per_week / 0.5);
            }

            // Default Macros (Balanced)
            const protein = (targetCalories * 0.3) / 4;
            const fat = (targetCalories * 0.3) / 9;
            const carbs = (targetCalories * 0.4) / 4;

            await nutritionService.saveProfile({
                ...formData,
                calculated_bmr: Math.round(bmr),
                calculated_tdee: Math.round(tdee),
                target_calories: Math.round(targetCalories),
                target_protein_g: Math.round(protein),
                target_fat_g: Math.round(fat),
                target_carbs_g: Math.round(carbs),
            });

            toast.success("Nutrition profile updated!");
            onComplete();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Nutrition Profile Builder</CardTitle>
                <CardDescription>Let&apos;s calculate your daily targets based on your body and goals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Sex</Label>
                        <Select
                            value={formData.sex}
                            onValueChange={(val) => setFormData({ ...formData, sex: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="F">Female</SelectItem>
                                <SelectItem value="M">Male</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Age</Label>
                        <Input
                            type="number"
                            placeholder="Years"
                            value={formData.age}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, age: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Weight (kg)</Label>
                        <Input
                            type="number"
                            placeholder="kg"
                            value={formData.weight}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, weight: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Height (cm)</Label>
                        <Input
                            type="number"
                            placeholder="cm"
                            value={formData.height}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, height: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Activity Level</Label>
                    <Select
                        value={formData.activity_level}
                        onValueChange={(val) => setFormData({ ...formData, activity_level: val })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sedentary">Sedentary (Office Job)</SelectItem>
                            <SelectItem value="light">Light (1-2 days/week)</SelectItem>
                            <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                            <SelectItem value="very_active">Very Active (6-7 days/week)</SelectItem>
                            <SelectItem value="extra_active">Extra Active (Phyiscal Job)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Goal</Label>
                    <Select
                        value={formData.goal}
                        onValueChange={(val) => setFormData({ ...formData, goal: val })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="lose">Lose Weight</SelectItem>
                            <SelectItem value="maintain">Maintain Weight</SelectItem>
                            <SelectItem value="gain">Gain Muscle</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between">
                        <Label>Rate (kg/week): {formData.goal_rate_kg_per_week}</Label>
                    </div>
                    <Slider
                        value={[formData.goal_rate_kg_per_week]}
                        min={0.1}
                        max={1.0}
                        step={0.1}
                        onValueChange={([val]) => setFormData({ ...formData, goal_rate_kg_per_week: val })}
                        className="py-4"
                    />
                </div>

                <Button onClick={handleSave} className="w-full bg-[#34D399] hover:bg-[#10B981] text-black font-semibold" disabled={loading}>
                    {loading ? "Saving..." : "Save Profile & Targets"}
                </Button>
            </CardContent>
        </Card>
    );
}
