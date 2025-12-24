import { FitnessScores, MacroTargets, FITNESS_THRESHOLDS, MACRO_SPLITS } from '@/lib/types/hotel-fitness';

/**
 * Calculate BMR using Mifflin-St Jeor equation
 */
export function calculateBMR(
  weight_kg: number,
  height_cm: number,
  age: number,
  sex: 'male' | 'female' | 'other'
): number {
  const baseCalc = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  
  switch (sex) {
    case 'male':
      return baseCalc + 5;
    case 'female':
      return baseCalc - 161;
    case 'other':
      return baseCalc - 78; // Average between male/female
    default:
      return baseCalc - 78;
  }
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 */
export function calculateTDEE(bmr: number, activityFactor: number): number {
  return Math.round(bmr * activityFactor);
}

/**
 * Calculate goal calories based on TDEE and goal
 */
export function calculateGoalCalories(
  tdee: number,
  goal: 'maintain' | 'lose' | 'gain'
): number {
  switch (goal) {
    case 'maintain':
      return tdee;
    case 'lose':
      return Math.max(1200, tdee - 400); // Don't go below 1200
    case 'gain':
      return tdee + 300;
    default:
      return tdee;
  }
}

/**
 * Calculate macro targets based on goal calories and goal type
 */
export function calculateMacroTargets(
  age: number,
  sex: 'male' | 'female' | 'other',
  height_cm: number,
  weight_kg: number,
  activityFactor: number = 1.4,
  goal: 'maintain' | 'lose' | 'gain' = 'maintain'
): MacroTargets {
  const bmr = calculateBMR(weight_kg, height_cm, age, sex);
  const tdee = calculateTDEE(bmr, activityFactor);
  const kcal = calculateGoalCalories(tdee, goal);
  
  // Select macro split based on goal
  const split = goal === 'lose' ? MACRO_SPLITS.cutting :
                goal === 'gain' ? MACRO_SPLITS.bulking :
                MACRO_SPLITS.maintain;
  
  const protein_g = Math.round((kcal * split.protein) / 4); // 4 kcal per gram
  const carbs_g = Math.round((kcal * split.carbs) / 4);     // 4 kcal per gram
  const fat_g = Math.round((kcal * split.fat) / 9);         // 9 kcal per gram
  
  return {
    kcal,
    protein_g,
    carbs_g,
    fat_g,
    bmr,
    tdee,
  };
}

/**
 * Normalize fitness test score to 0-100 scale
 */
function normalizeScore(value: number, thresholds: { easy: number; medium: number; hard: number }, reverse: boolean = false): number {
  if (reverse) {
    // For metrics where lower is better (like heart rate)
    if (value >= thresholds.easy) return 0;
    if (value <= thresholds.hard) return 100;
    return Math.round(100 - ((value - thresholds.hard) / (thresholds.easy - thresholds.hard)) * 100);
  } else {
    // For metrics where higher is better
    if (value <= thresholds.easy) return 0;
    if (value >= thresholds.hard) return 100;
    return Math.round(((value - thresholds.easy) / (thresholds.hard - thresholds.easy)) * 100);
  }
}

/**
 * Calculate fitness scores from test results
 */
export function calculateFitnessScores(
  max_pushups: number = 0,
  squats_60s: number = 0,
  plank_hold_sec: number = 0,
  step_test_hr: number = 100,
  age: number,
  sex: 'male' | 'female' | 'other'
): FitnessScores {
  // Age and sex adjustments (simplified - could be more sophisticated)
  const ageAdjustment = age > 40 ? 0.9 : age > 60 ? 0.8 : 1.0;
  const sexAdjustment = sex === 'female' ? 0.85 : 1.0; // Adjust for biological differences
  
  // Adjust thresholds based on demographics
  const adjustedThresholds = {
    pushups: {
      easy: Math.round(FITNESS_THRESHOLDS.pushups.easy * ageAdjustment * sexAdjustment),
      medium: Math.round(FITNESS_THRESHOLDS.pushups.medium * ageAdjustment * sexAdjustment),
      hard: Math.round(FITNESS_THRESHOLDS.pushups.hard * ageAdjustment * sexAdjustment),
    },
    squats_60s: {
      easy: Math.round(FITNESS_THRESHOLDS.squats_60s.easy * ageAdjustment),
      medium: Math.round(FITNESS_THRESHOLDS.squats_60s.medium * ageAdjustment),
      hard: Math.round(FITNESS_THRESHOLDS.squats_60s.hard * ageAdjustment),
    },
    plank_sec: {
      easy: Math.round(FITNESS_THRESHOLDS.plank_sec.easy * ageAdjustment),
      medium: Math.round(FITNESS_THRESHOLDS.plank_sec.medium * ageAdjustment),
      hard: Math.round(FITNESS_THRESHOLDS.plank_sec.hard * ageAdjustment),
    },
  };
  
  // Calculate normalized scores
  const pushups = normalizeScore(max_pushups, adjustedThresholds.pushups);
  const squats = normalizeScore(squats_60s, adjustedThresholds.squats_60s);
  const plank = normalizeScore(plank_hold_sec, adjustedThresholds.plank_sec);
  const cardio = normalizeScore(step_test_hr, FITNESS_THRESHOLDS.step_recovery_hr, true);
  
  // Overall score is weighted average
  const overall = Math.round((pushups * 0.25 + squats * 0.25 + plank * 0.25 + cardio * 0.25));
  
  // Map to difficulty level
  let level: 'easy' | 'medium' | 'hard';
  if (overall <= 33) {
    level = 'easy';
  } else if (overall <= 66) {
    level = 'medium';
  } else {
    level = 'hard';
  }
  
  return {
    pushups,
    squats,
    plank,
    cardio,
    overall,
    level,
  };
}

/**
 * Apply adaptive difficulty adjustment
 */
export function applyDifficultyAdjustment(
  baseWorkTime: number,
  baseRestTime: number,
  adjustment: number // -1 (easier) to +1 (harder)
): { workTime: number; restTime: number } {
  // Clamp adjustment between -1 and 1
  const clampedAdjustment = Math.max(-1, Math.min(1, adjustment));
  
  // Apply 20% change per adjustment level
  const workMultiplier = 1 + (clampedAdjustment * 0.2);
  const restMultiplier = 1 - (clampedAdjustment * 0.1); // Less rest when harder
  
  return {
    workTime: Math.max(10, Math.round(baseWorkTime * workMultiplier)), // Min 10 seconds
    restTime: Math.max(5, Math.round(baseRestTime * restMultiplier)),   // Min 5 seconds
  };
}

/**
 * Calculate per-meal macro allocation
 */
export function calculateMealMacros(
  dailyMacros: MacroTargets,
  mealsPerDay: number = 3,
  preWorkout: boolean = false,
  postWorkout: boolean = false
): MacroTargets {
  const baseMealKcal = Math.round(dailyMacros.kcal / mealsPerDay);
  const baseMealProtein = Math.round(dailyMacros.protein_g / mealsPerDay);
  const baseMealCarbs = Math.round(dailyMacros.carbs_g / mealsPerDay);
  const baseMealFat = Math.round(dailyMacros.fat_g / mealsPerDay);
  
  // Adjust for workout timing
  let carbMultiplier = 1.0;
  let proteinMultiplier = 1.0;
  
  if (preWorkout) {
    carbMultiplier = 1.2; // More carbs pre-workout
    proteinMultiplier = 0.8;
  } else if (postWorkout) {
    carbMultiplier = 1.3; // Even more carbs post-workout
    proteinMultiplier = 1.2; // More protein for recovery
  }
  
  return {
    kcal: baseMealKcal,
    protein_g: Math.round(baseMealProtein * proteinMultiplier),
    carbs_g: Math.round(baseMealCarbs * carbMultiplier),
    fat_g: baseMealFat,
    bmr: dailyMacros.bmr,
    tdee: dailyMacros.tdee,
  };
}

/**
 * Calculate menu item with size adjustment
 */
export function calculateMenuItemMacros(
  baseKcal: number,
  baseProtein: number,
  baseCarbs: number,
  baseFat: number,
  basePriceCents: number,
  size: 'S' | 'M' | 'L' = 'M'
): {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  price_cents: number;
} {
  const sizeMultipliers = { S: 0.8, M: 1.0, L: 1.3 };
  const multiplier = sizeMultipliers[size];
  
  return {
    kcal: Math.round(baseKcal * multiplier),
    protein_g: Math.round(baseProtein * multiplier * 10) / 10, // Round to 1 decimal
    carbs_g: Math.round(baseCarbs * multiplier * 10) / 10,
    fat_g: Math.round(baseFat * multiplier * 10) / 10,
    price_cents: Math.round(basePriceCents * multiplier),
  };
}

/**
 * Find best menu item matches for macro targets
 */
export function findBestMenuMatches(
  menuItems: Array<{
    id: string;
    name: string;
    base_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    price_cents: number;
    category: string;
  }>,
  targetMacros: MacroTargets,
  category?: string,
  tolerance: number = 0.15 // 15% tolerance
): Array<{
  item: any;
  size: 'S' | 'M' | 'L';
  macros: any;
  score: number;
}> {
  const matches = [];
  
  for (const item of menuItems) {
    if (category && item.category !== category) continue;
    
    for (const size of ['S', 'M', 'L'] as const) {
      const itemMacros = calculateMenuItemMacros(
        item.base_kcal,
        item.protein_g,
        item.carbs_g,
        item.fat_g,
        item.price_cents,
        size
      );
      
      // Calculate how well this matches target macros
      const kcalDiff = Math.abs(itemMacros.kcal - targetMacros.kcal) / targetMacros.kcal;
      const proteinDiff = Math.abs(itemMacros.protein_g - targetMacros.protein_g) / targetMacros.protein_g;
      const carbsDiff = Math.abs(itemMacros.carbs_g - targetMacros.carbs_g) / targetMacros.carbs_g;
      const fatDiff = Math.abs(itemMacros.fat_g - targetMacros.fat_g) / targetMacros.fat_g;
      
      // Weighted score (kcal and protein are most important)
      const score = (kcalDiff * 0.4) + (proteinDiff * 0.3) + (carbsDiff * 0.2) + (fatDiff * 0.1);
      
      // Only include if within tolerance
      if (score <= tolerance) {
        matches.push({
          item,
          size,
          macros: itemMacros,
          score,
        });
      }
    }
  }
  
  // Sort by best score (lowest difference)
  return matches.sort((a, b) => a.score - b.score);
}