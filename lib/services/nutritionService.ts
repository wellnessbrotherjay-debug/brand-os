import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

// @ts-ignore
export type DailyLog = Database['public']['Tables']['nutrition_daily_logs']['Row'];
// @ts-ignore
export type MealEntry = Database['public']['Tables']['nutrition_meal_entries']['Row'];

// USDA API Configuration (Mock for now, ready for real key)
const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY || 'DEMO_KEY';
const USDA_API_ENDPOINT = 'https://api.nal.usda.gov/fdc/v1/foods/search';

export const nutritionService = {
    // --- Daily Logs ---

    async getDailyLog(date: string, userId: string) {
        // Try to get log, if not exists return null (UI will show empty state)
        const { data } = await supabase
            .from('nutrition_daily_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('date', date)
            .single();

        return data;
    },

    async getCreateDailyLog(date: string, userId: string) {
        let log = await this.getDailyLog(date, userId);

        if (!log) {
            const { data, error } = await (supabase.from('nutrition_daily_logs') as any)
                .insert({
                    user_id: userId,
                    date: date,
                    total_calories: 0,
                    total_protein_g: 0,
                    total_carbs_g: 0,
                    total_fats_g: 0
                })
                .select()
                .single();

            if (error) throw error;
            log = data;
        }
        return log;
    },

    async getMealsForDay(dailyLogId: string) {
        const { data, error } = await supabase
            .from('nutrition_meal_entries')
            .select('*')
            .eq('daily_log_id', dailyLogId);

        if (error) throw error;
        return data;
    },

    // --- Meal Logging ---

    async logFood(userId: string, date: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', food: any) {
        // 1. Ensure Daily Log Exists
        const dailyLog = await this.getCreateDailyLog(date, userId);

        // 2. Insert Meal Entry
        const { data: entry, error } = await (supabase.from('nutrition_meal_entries') as any)
            .insert({
                daily_log_id: dailyLog!.id,
                meal_type: mealType,
                food_name: food.name,
                quantity: food.quantity || 1,
                unit: food.unit || 'serving',
                calories: food.calories,
                protein_g: food.protein,
                carbs_g: food.carbs,
                fats_g: food.fats,
                usda_fdc_id: food.fdcId
            })
            .select()
            .single();

        if (error) throw error;

        // 3. Update Daily Totals (Trigger-like behavior in app logic for now)
        await this.updateDailyTotals(dailyLog!.id);

        return entry;
    },

    async updateDailyTotals(dailyLogId: string) {
        // Recalculate sums
        const { data: meals } = await (supabase.from('nutrition_meal_entries') as any)
            .select('calories, protein_g, carbs_g, fats_g')
            .eq('daily_log_id', dailyLogId);

        if (!meals) return;

        const totals = meals.reduce((acc, curr) => ({
            cals: acc.cals + (curr.calories || 0),
            pro: acc.pro + (curr.protein_g || 0),
            carb: acc.carb + (curr.carbs_g || 0),
            fat: acc.fat + (curr.fats_g || 0)
        }), { cals: 0, pro: 0, carb: 0, fat: 0 });

        await (supabase.from('nutrition_daily_logs') as any)
            .update({
                total_calories: totals.cals,
                total_protein_g: totals.pro,
                total_carbs_g: totals.carb,
                total_fats_g: totals.fat
            })
            .eq('id', dailyLogId);
    },

    // --- External API (USDA) ---

    async searchFood(query: string) {
        if (!query) return [];

        try {
            // Use USDA API
            // Note: In production, this call should ideally happen server-side to protect the key,
            // but for this implementation phase we'll do it client-side or via a Next.js API route.
            // As this is a service file used in client components, we'll fetch directly for now.
            const response = await fetch(`${USDA_API_ENDPOINT}?query=${query}&pageSize=10&api_key=${USDA_API_KEY}`);
            if (!response.ok) {
                console.warn("USDA API call failed, falling back to mock");
                return this.getMockFoodResults(query);
            }

            const data = await response.json();

            // Map USDA FDC format to our simple format
            return data.foods.map((item: any) => {
                const nutrients = item.foodNutrients || [];
                const getNutrient = (id: number) => {
                    const n = nutrients.find((n: any) => n.nutrientId === id);
                    return n ? n.value : 0;
                };

                // USDA Nutrient IDs:
                // 1008 = Calories
                // 1003 = Protein
                // 1005 = Carbs
                // 1004 = Fat
                return {
                    name: item.description,
                    calories: Math.round(getNutrient(1008)),
                    protein: Math.round(getNutrient(1003)),
                    carbs: Math.round(getNutrient(1005)),
                    fats: Math.round(getNutrient(1004)),
                    fdcId: item.fdcId,
                    brand: item.brandOwner
                };
            });

        } catch (error) {
            console.error("Search error:", error);
            return this.getMockFoodResults(query);
        }
    },

    getMockFoodResults(query: string) {
        const db = [
            { name: "Scrambled Eggs", calories: 140, protein: 12, carbs: 1, fats: 9 },
            { name: "Chicken Breast (Grilled)", calories: 165, protein: 31, carbs: 0, fats: 3.6 },
            { name: "Brown Rice (1 cup)", calories: 216, protein: 5, carbs: 45, fats: 1.8 },
            { name: "Avocado (Half)", calories: 160, protein: 2, carbs: 9, fats: 15 },
            { name: "Protein Shake", calories: 120, protein: 24, carbs: 3, fats: 1 },
            { name: "Apple", calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
            { name: "Greek Yogurt", calories: 100, protein: 10, carbs: 6, fats: 0 },
            { name: "Oatmeal", calories: 150, protein: 5, carbs: 27, fats: 3 }
        ];
        return db.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
    }
};
