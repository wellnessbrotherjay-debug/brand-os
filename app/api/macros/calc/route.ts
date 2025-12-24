import { NextRequest, NextResponse } from 'next/server';
import { MacroCalcSchema } from '@/lib/types/hotel-fitness';
import { calculateMacroTargets, calculateMealMacros } from '@/lib/utils/fitness-calculations';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input with Zod
    const validatedData = MacroCalcSchema.parse(body);
    
    const {
      age,
      sex,
      height_cm,
      weight_kg,
      activity_factor = 1.4,
      goal = 'maintain',
      body_fat_pct,
    } = validatedData;

    // Calculate daily macro targets
    const dailyMacros = calculateMacroTargets(
      age,
      sex,
      height_cm,
      weight_kg,
      activity_factor,
      goal
    );

    // Calculate meal-specific macros
    const mealsPerDay = 3; // Could be made configurable
    const regularMeal = calculateMealMacros(dailyMacros, mealsPerDay);
    const preWorkoutMeal = calculateMealMacros(dailyMacros, mealsPerDay, true, false);
    const postWorkoutMeal = calculateMealMacros(dailyMacros, mealsPerDay, false, true);

    return NextResponse.json({
      daily: dailyMacros,
      meals: {
        regular: regularMeal,
        pre_workout: preWorkoutMeal,
        post_workout: postWorkoutMeal,
      },
      meta: {
        bmi: Math.round((weight_kg / Math.pow(height_cm / 100, 2)) * 10) / 10,
        body_fat_category: body_fat_pct ? categorizeBF(body_fat_pct, sex) : null,
        activity_level: categorizeActivity(activity_factor),
      },
    });

  } catch (error) {
    console.error('Macro calculation API error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function categorizeBF(bodyFat: number, sex: string): string {
  if (sex === 'male') {
    if (bodyFat < 6) return 'Essential';
    if (bodyFat < 14) return 'Athletic';
    if (bodyFat < 18) return 'Fitness';
    if (bodyFat < 25) return 'Average';
    return 'Above Average';
  } else {
    if (bodyFat < 16) return 'Essential';
    if (bodyFat < 21) return 'Athletic';
    if (bodyFat < 25) return 'Fitness';
    if (bodyFat < 32) return 'Average';
    return 'Above Average';
  }
}

function categorizeActivity(factor: number): string {
  if (factor <= 1.2) return 'Sedentary';
  if (factor <= 1.375) return 'Light Activity';
  if (factor <= 1.55) return 'Moderate Activity';
  if (factor <= 1.725) return 'High Activity';
  return 'Extremely Active';
}