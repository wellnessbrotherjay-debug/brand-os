import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Flame, Beef, Apple, Zap, Target, ArrowLeft, Utensils, Fish, Egg, Milk, Wheat, Droplet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface NutritionProfile {
  calculated_bmr: number | null;
  calculated_tdee: number | null;
  target_calories: number | null;
  target_protein_g: number | null;
  target_fat_g: number | null;
  target_carbs_g: number | null;
  meals_per_day: number | null;
  diet_type: string;
  goal: string;
  activity_level: string;
}

const NutritionTargets = () => {
  const [profile, setProfile] = useState<NutritionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("nutrition_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "No nutrition plan found",
          description: "Please create a nutrition plan first",
          variant: "destructive",
        });
        navigate("/body?tab=nutrition");
        return;
      }

      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error loading nutrition targets",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getGoalLabel = (goal: string) => {
    const labels: { [key: string]: string } = {
      lose: "Weight Loss",
      maintain: "Maintain Weight",
      gain: "Weight Gain (Bulk)",
    };
    return labels[goal] || goal;
  };

  const getActivityLabel = (level: string) => {
    const labels: { [key: string]: string } = {
      sedentary: "Sedentary",
      light: "Light Activity",
      moderate: "Moderate Activity",
      very_active: "Very Active",
      extra_active: "Extra Active",
    };
    return labels[level] || level;
  };

  const getDietLabel = (diet: string) => {
    const labels: { [key: string]: string } = {
      balanced: "Balanced",
      high_protein: "High Protein",
      low_carb: "Low Carb",
      keto: "Keto",
      custom: "Custom",
    };
    return labels[diet] || diet;
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/body?tab=nutrition")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Your Nutrition Targets</h1>
            <p className="text-muted-foreground">Daily macro and calorie goals</p>
          </div>
        </div>
        <Button onClick={() => navigate("/food-tracking")}>
          <Utensils className="mr-2 h-4 w-4" />
          Track Food
        </Button>
      </div>

      {/* Goal Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Nutrition Plan Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Goal</p>
            <p className="text-lg font-semibold">{getGoalLabel(profile.goal)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Activity Level</p>
            <p className="text-lg font-semibold">{getActivityLabel(profile.activity_level)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Diet Type</p>
            <p className="text-lg font-semibold">{getDietLabel(profile.diet_type)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Meals Per Day</p>
            <p className="text-lg font-semibold">{profile.meals_per_day || 3}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">BMR (Base Metabolic Rate)</p>
            <p className="text-lg font-semibold">{profile.calculated_bmr?.toFixed(0)} kcal</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">TDEE (Total Daily Energy)</p>
            <p className="text-lg font-semibold">{profile.calculated_tdee?.toFixed(0)} kcal</p>
          </div>
        </CardContent>
      </Card>

      {/* Daily Targets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Daily Calories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profile.target_calories?.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total energy target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Beef className="h-4 w-4" />
              Protein
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profile.target_protein_g?.toFixed(0)}g</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((profile.target_protein_g || 0) * 4 / (profile.target_calories || 1) * 100).toFixed(0)}% of calories
            </p>
            <Progress 
              value={((profile.target_protein_g || 0) * 4 / (profile.target_calories || 1) * 100)} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Apple className="h-4 w-4" />
              Carbs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profile.target_carbs_g?.toFixed(0)}g</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((profile.target_carbs_g || 0) * 4 / (profile.target_calories || 1) * 100).toFixed(0)}% of calories
            </p>
            <Progress 
              value={((profile.target_carbs_g || 0) * 4 / (profile.target_calories || 1) * 100)} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Fat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profile.target_fat_g?.toFixed(0)}g</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((profile.target_fat_g || 0) * 9 / (profile.target_calories || 1) * 100).toFixed(0)}% of calories
            </p>
            <Progress 
              value={((profile.target_fat_g || 0) * 9 / (profile.target_calories || 1) * 100)} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Full Day Summary */}
      <Card className="border-2 border-primary/30">
        <CardHeader>
          <CardTitle>Daily Totals</CardTitle>
          <CardDescription>
            Your complete nutrition targets for the day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center space-y-2">
              <Flame className="h-8 w-8 mx-auto text-primary" />
              <div>
                <p className="text-3xl font-bold">{profile.target_calories?.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Calories</p>
              </div>
            </div>
            <div className="text-center space-y-2">
              <Beef className="h-8 w-8 mx-auto text-primary" />
              <div>
                <p className="text-3xl font-bold">{profile.target_protein_g?.toFixed(0)}g</p>
                <p className="text-sm text-muted-foreground">Protein</p>
              </div>
            </div>
            <div className="text-center space-y-2">
              <Apple className="h-8 w-8 mx-auto text-primary" />
              <div>
                <p className="text-3xl font-bold">{profile.target_carbs_g?.toFixed(0)}g</p>
                <p className="text-sm text-muted-foreground">Carbs</p>
              </div>
            </div>
            <div className="text-center space-y-2">
              <Zap className="h-8 w-8 mx-auto text-primary" />
              <div>
                <p className="text-3xl font-bold">{profile.target_fat_g?.toFixed(0)}g</p>
                <p className="text-sm text-muted-foreground">Fat</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Meal Building Guide</CardTitle>
          <CardDescription>
            Exact portions and macros for each meal type
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Breakfast Suggestions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                Breakfast Options
              </h3>
              <div className="text-sm text-muted-foreground">
                Target: {((profile.target_protein_g || 0) / (profile.meals_per_day || 3)).toFixed(0)}g protein • 
                {' '}{((profile.target_carbs_g || 0) / (profile.meals_per_day || 3)).toFixed(0)}g carbs • 
                {' '}{((profile.target_fat_g || 0) / (profile.meals_per_day || 3)).toFixed(0)}g fat
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Beef className="h-4 w-4" />
                  Protein Sources (Choose 1)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Egg className="h-4 w-4 text-primary" />
                      <span className="font-medium">3 Large Eggs</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 21g • Carbs: 1.5g • Fat: 15g • Calories: 234
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Milk className="h-4 w-4 text-primary" />
                      <span className="font-medium">200g Greek Yogurt (0% fat)</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 20g • Carbs: 8g • Fat: 0g • Calories: 112
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Fish className="h-4 w-4 text-primary" />
                      <span className="font-medium">100g Smoked Salmon</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 23g • Carbs: 0g • Fat: 4g • Calories: 124
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Beef className="h-4 w-4 text-primary" />
                      <span className="font-medium">4 Slices Turkey Bacon</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 16g • Carbs: 0g • Fat: 8g • Calories: 140
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Wheat className="h-4 w-4" />
                  Carb Sources (Choose 1)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Wheat className="h-4 w-4 text-primary" />
                      <span className="font-medium">60g Dry Oatmeal</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 8g • Carbs: 42g • Fat: 4g • Calories: 228
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Apple className="h-4 w-4 text-primary" />
                      <span className="font-medium">2 Slices Whole Wheat Bread</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 8g • Carbs: 40g • Fat: 2g • Calories: 200
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  Healthy Fats (Choose 1)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Apple className="h-4 w-4 text-primary" />
                      <span className="font-medium">½ Medium Avocado (75g)</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 1.5g • Carbs: 6g • Fat: 11g • Calories: 120
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-primary" />
                      <span className="font-medium">30g Mixed Nuts</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 6g • Carbs: 5g • Fat: 16g • Calories: 180
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Lunch/Dinner Suggestions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                Lunch & Dinner Options
              </h3>
              <div className="text-sm text-muted-foreground">
                Target: {((profile.target_protein_g || 0) / (profile.meals_per_day || 3) * 1.2).toFixed(0)}g protein • 
                {' '}{((profile.target_carbs_g || 0) / (profile.meals_per_day || 3) * 1.3).toFixed(0)}g carbs • 
                {' '}{((profile.target_fat_g || 0) / (profile.meals_per_day || 3)).toFixed(0)}g fat
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Beef className="h-4 w-4" />
                  Protein Sources (Choose 1)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Beef className="h-4 w-4 text-primary" />
                      <span className="font-medium">150g Chicken Breast (cooked)</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 47g • Carbs: 0g • Fat: 5g • Calories: 248
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Fish className="h-4 w-4 text-primary" />
                      <span className="font-medium">150g Salmon Fillet</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 34g • Carbs: 0g • Fat: 11g • Calories: 250
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Beef className="h-4 w-4 text-primary" />
                      <span className="font-medium">150g Lean Ground Beef (93/7)</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 35g • Carbs: 0g • Fat: 11g • Calories: 248
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Beef className="h-4 w-4 text-primary" />
                      <span className="font-medium">150g Turkey Breast</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 45g • Carbs: 0g • Fat: 2g • Calories: 195
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Wheat className="h-4 w-4" />
                  Carb Sources (Choose 1)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Wheat className="h-4 w-4 text-primary" />
                      <span className="font-medium">200g White Rice (cooked)</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 5g • Carbs: 56g • Fat: 0.5g • Calories: 260
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Apple className="h-4 w-4 text-primary" />
                      <span className="font-medium">200g Sweet Potato (cooked)</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 4g • Carbs: 48g • Fat: 0.5g • Calories: 180
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  Healthy Fats (Choose 1)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-primary" />
                      <span className="font-medium">1 tbsp Olive Oil (15ml)</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 0g • Carbs: 0g • Fat: 14g • Calories: 120
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Apple className="h-4 w-4 text-primary" />
                      <span className="font-medium">½ Medium Avocado (75g)</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 1.5g • Carbs: 6g • Fat: 11g • Calories: 120
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Snack Suggestions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Apple className="h-5 w-5 text-primary" />
                Snack Options
              </h3>
              <div className="text-sm text-muted-foreground">
                Target: {((profile.target_protein_g || 0) / (profile.meals_per_day || 3) * 0.6).toFixed(0)}g protein • 
                {' '}{((profile.target_carbs_g || 0) / (profile.meals_per_day || 3) * 0.4).toFixed(0)}g carbs • 
                {' '}{((profile.target_fat_g || 0) / (profile.meals_per_day || 3) * 0.5).toFixed(0)}g fat
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Beef className="h-4 w-4" />
                  Protein Snacks (Choose 1)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Milk className="h-4 w-4 text-primary" />
                      <span className="font-medium">1 Scoop Whey Protein (30g)</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 25g • Carbs: 3g • Fat: 1g • Calories: 120
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Milk className="h-4 w-4 text-primary" />
                      <span className="font-medium">150g Cottage Cheese (low-fat)</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 18g • Carbs: 6g • Fat: 3g • Calories: 120
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Beef className="h-4 w-4 text-primary" />
                      <span className="font-medium">30g Beef Jerky</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 15g • Carbs: 3g • Fat: 2g • Calories: 90
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Egg className="h-4 w-4 text-primary" />
                      <span className="font-medium">2 Large Hard Boiled Eggs</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 14g • Carbs: 1g • Fat: 10g • Calories: 156
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Wheat className="h-4 w-4" />
                  Carb Snacks (Choose 1)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Apple className="h-4 w-4 text-primary" />
                      <span className="font-medium">1 Medium Banana (120g)</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 1g • Carbs: 27g • Fat: 0g • Calories: 105
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Wheat className="h-4 w-4 text-primary" />
                      <span className="font-medium">2 Rice Cakes (18g)</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 1.5g • Carbs: 15g • Fat: 0.5g • Calories: 70
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  Healthy Fat Snacks (Choose 1)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-primary" />
                      <span className="font-medium">28g Almonds (~23 nuts)</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 6g • Carbs: 6g • Fat: 14g • Calories: 164
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-primary" />
                      <span className="font-medium">2 tbsp Natural Peanut Butter</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein: 8g • Carbs: 6g • Fat: 16g • Calories: 190
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Timing Breakdown with Pre/Post Workout */}
      <Card>
        <CardHeader>
          <CardTitle>Meal Timing Strategy</CardTitle>
          <CardDescription>
            Optimized carb distribution for training days
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pre-Workout Meal */}
          <div className="border-l-4 border-primary pl-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Pre-Workout Meal (2-3 hours before)
            </h3>
            <div className="grid gap-4 md:grid-cols-4 bg-primary/5 p-4 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Calories</p>
                <p className="text-xl font-bold">{((profile.target_calories || 0) * 0.3).toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protein</p>
                <p className="text-xl font-bold">{((profile.target_protein_g || 0) * 0.25).toFixed(0)}g</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Carbs (Higher)</p>
                <p className="text-xl font-bold text-primary">{((profile.target_carbs_g || 0) * 0.4).toFixed(0)}g</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fat (Lower)</p>
                <p className="text-xl font-bold">{((profile.target_fat_g || 0) * 0.2).toFixed(0)}g</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Focus on easily digestible carbs for energy. Examples: Oatmeal, banana, toast with honey
            </p>
          </div>

          {/* Post-Workout Meal */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              Post-Workout Meal (Within 1 hour)
            </h3>
            <div className="grid gap-4 md:grid-cols-4 bg-green-500/5 p-4 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Calories</p>
                <p className="text-xl font-bold">{((profile.target_calories || 0) * 0.35).toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protein (Higher)</p>
                <p className="text-xl font-bold text-green-600">{((profile.target_protein_g || 0) * 0.4).toFixed(0)}g</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Carbs</p>
                <p className="text-xl font-bold">{((profile.target_carbs_g || 0) * 0.4).toFixed(0)}g</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fat</p>
                <p className="text-xl font-bold">{((profile.target_fat_g || 0) * 0.25).toFixed(0)}g</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Prioritize protein for recovery and carbs to replenish glycogen. Examples: Chicken & rice, protein shake with fruit
            </p>
          </div>

          {/* Other Meals */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Utensils className="h-5 w-5 text-blue-500" />
              Other Meals (Remaining)
            </h3>
            <div className="grid gap-4 md:grid-cols-4 bg-blue-500/5 p-4 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Calories</p>
                <p className="text-xl font-bold">{((profile.target_calories || 0) * 0.35).toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protein</p>
                <p className="text-xl font-bold">{((profile.target_protein_g || 0) * 0.35).toFixed(0)}g</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Carbs</p>
                <p className="text-xl font-bold">{((profile.target_carbs_g || 0) * 0.2).toFixed(0)}g</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fat</p>
                <p className="text-xl font-bold">{((profile.target_fat_g || 0) * 0.55).toFixed(0)}g</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Balanced nutrition throughout the day. Focus on whole foods and nutrient density
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Update Your Plan</CardTitle>
            <CardDescription>Recalculate if your goals change</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => navigate("/body?tab=nutrition")}>
              Edit Nutrition Plan
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Start Tracking</CardTitle>
            <CardDescription>Log your meals and monitor progress</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/food-tracking")}>
              <Utensils className="mr-2 h-4 w-4" />
              Track Food Today
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NutritionTargets;
