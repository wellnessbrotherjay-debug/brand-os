
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save, Trash2 } from "lucide-react";
import { nutritionService } from "@/lib/services/nutritionService";
import { toast } from "sonner";

interface RecipeDesignerProps {
    onComplete: () => void;
}

interface Ingredient {
    id: string; // temp id
    name: string;
    amount: number;
    unit: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
}

export function RecipeDesigner({ onComplete }: RecipeDesignerProps) {
    const [loading, setLoading] = useState(false);
    const [basicInfo, setBasicInfo] = useState({
        name: "",
        description: "",
        servings: 1,
        prep_time_minutes: "",
        cook_time_minutes: "",
        instructions: "",
    });

    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [newIngredient, setNewIngredient] = useState<Partial<Ingredient>>({
        name: "",
        amount: 0,
        unit: "g",
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
    });

    const handleAddIngredient = () => {
        if (!newIngredient.name) return;
        setIngredients([
            ...ingredients,
            { ...newIngredient, id: Math.random().toString() } as Ingredient
        ]);
        setNewIngredient({
            name: "",
            amount: 0,
            unit: "g",
            calories: 0,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
        });
    };

    const removeIngredient = (id: string) => {
        setIngredients(ingredients.filter(i => i.id !== id));
    };

    const calculateTotals = () => {
        const totals = ingredients.reduce((acc, curr) => ({
            calories: acc.calories + (Number(curr.calories) || 0),
            protein: acc.protein + (Number(curr.protein_g) || 0),
            carbs: acc.carbs + (Number(curr.carbs_g) || 0),
            fat: acc.fat + (Number(curr.fat_g) || 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        const servings = Number(basicInfo.servings) || 1;
        return {
            calories: Math.round(totals.calories / servings),
            protein: Math.round(totals.protein / servings),
            carbs: Math.round(totals.carbs / servings),
            fat: Math.round(totals.fat / servings),
        };
    };

    const totals = calculateTotals();

    const handleSave = async () => {
        if (!basicInfo.name) {
            toast.error("Recipe name is required");
            return;
        }

        setLoading(true);
        try {
            await nutritionService.createRecipe({
                name: basicInfo.name,
                description: basicInfo.description,
                servings: Number(basicInfo.servings),
                prep_time_minutes: Number(basicInfo.prep_time_minutes),
                cook_time_minutes: Number(basicInfo.cook_time_minutes),
                instructions: basicInfo.instructions,
                total_calories: totals.calories,
                total_protein_g: totals.protein,
                total_carbs_g: totals.carbs,
                total_fat_g: totals.fat,
                is_public: false
            }, ingredients);

            toast.success("Recipe saved!");
            onComplete();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save recipe");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
                <Card className="border-none shadow-none bg-transparent p-0">
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Recipe Details</h2>

                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={basicInfo.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                                placeholder="My Delicious Recipe"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={basicInfo.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                                placeholder="Brief description..."
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Servings</Label>
                                <Input
                                    type="number"
                                    value={basicInfo.servings}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBasicInfo({ ...basicInfo, servings: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Prep (min)</Label>
                                <Input
                                    type="number"
                                    value={basicInfo.prep_time_minutes}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBasicInfo({ ...basicInfo, prep_time_minutes: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Cook (min)</Label>
                                <Input
                                    type="number"
                                    value={basicInfo.cook_time_minutes}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBasicInfo({ ...basicInfo, cook_time_minutes: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Instructions</Label>
                            <Textarea
                                className="min-h-[150px]"
                                value={basicInfo.instructions}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBasicInfo({ ...basicInfo, instructions: e.target.value })}
                                placeholder="Step by step instructions..."
                            />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="bg-[#1A1A1A] border-[#333]">
                    <CardHeader>
                        <CardTitle>Ingredients</CardTitle>
                        <CardDescription>Add ingredients to calculate macros.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                placeholder="Ingredient Name"
                                value={newIngredient.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="number"
                                    placeholder="Amount"
                                    value={newIngredient.amount || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIngredient({ ...newIngredient, amount: Number(e.target.value) })}
                                />
                                <Input
                                    placeholder="Unit (g, oz)"
                                    value={newIngredient.unit}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                <Input
                                    type="number"
                                    placeholder="Cals"
                                    value={newIngredient.calories || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIngredient({ ...newIngredient, calories: Number(e.target.value) })}
                                />
                                <Input
                                    type="number"
                                    placeholder="P (g)"
                                    value={newIngredient.protein_g || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIngredient({ ...newIngredient, protein_g: Number(e.target.value) })}
                                />
                                <Input
                                    type="number"
                                    placeholder="C (g)"
                                    value={newIngredient.carbs_g || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIngredient({ ...newIngredient, carbs_g: Number(e.target.value) })}
                                />
                                <Input
                                    type="number"
                                    placeholder="F (g)"
                                    value={newIngredient.fat_g || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIngredient({ ...newIngredient, fat_g: Number(e.target.value) })}
                                />
                            </div>
                            <Button variant="secondary" className="w-full" onClick={handleAddIngredient}>
                                <Plus className="w-4 h-4 mr-2" /> Add Ingredient
                            </Button>
                        </div>

                        {/* Ingredient List */}
                        <div className="space-y-2 mt-4">
                            {ingredients.map(ing => (
                                <div key={ing.id} className="flex justify-between items-center p-2 bg-muted/20 rounded text-sm">
                                    <span>{ing.amount}{ing.unit} {ing.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{ing.calories}kcal</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeIngredient(ing.id)}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#1A1A1A] border-[#333]">
                    <CardHeader>
                        <CardTitle>Nutrition per Serving</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 text-center">
                            <div>
                                <div className="text-2xl font-bold">{totals.calories}</div>
                                <div className="text-xs text-muted-foreground">kcal</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{totals.protein}g</div>
                                <div className="text-xs text-muted-foreground">Prot</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{totals.carbs}g</div>
                                <div className="text-xs text-muted-foreground">Carb</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{totals.fat}g</div>
                                <div className="text-xs text-muted-foreground">Fat</div>
                            </div>
                        </div>

                        <Button className="w-full mt-6 bg-[#34D399] hover:bg-[#10B981] text-black" onClick={handleSave} disabled={loading}>
                            {loading ? "Saving..." : "Save Recipe"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
