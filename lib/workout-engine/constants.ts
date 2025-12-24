// Base equipment types (always available)
export type BaseEquipmentOption =
  | "dumbbells"
  | "barbell"
  | "treadmill"
  | "trx"
  | "bosu"
  | "bodyweight"
  | "box"
  | "bench"
  | "bike";

// Dynamic equipment type (allows custom equipment)
export type EquipmentOption = BaseEquipmentOption | string;

export interface ExerciseDefinition {
  name: string;
  equipment: EquipmentOption;
}

// Base equipment options (always available)
export const BASE_EQUIPMENT_OPTIONS: BaseEquipmentOption[] = [
  "dumbbells",
  "barbell",
  "treadmill", 
  "trx",
  "bosu",
  "bodyweight",
  "box",
  "bench",
  "bike",
];

// Dynamic equipment storage
let customEquipmentOptions: string[] = [
  "incline bench",
  "cable tricep", 
  "seated row"
];

// Get all available equipment options (base + custom)
export const getAllEquipmentOptions = (): EquipmentOption[] => {
  return [...BASE_EQUIPMENT_OPTIONS, ...customEquipmentOptions];
};

// Add custom equipment option
export const addCustomEquipment = (equipment: string): void => {
  const normalizedEquipment = equipment.toLowerCase().trim();
  if (normalizedEquipment && !customEquipmentOptions.includes(normalizedEquipment)) {
    customEquipmentOptions.push(normalizedEquipment);
  }
};

// Remove custom equipment option
export const removeCustomEquipment = (equipment: string): void => {
  customEquipmentOptions = customEquipmentOptions.filter(eq => eq !== equipment);
};

// Get custom equipment options
export const getCustomEquipmentOptions = (): string[] => {
  return [...customEquipmentOptions];
};

// For backward compatibility
export const EQUIPMENT_OPTIONS: EquipmentOption[] = getAllEquipmentOptions();

// Base exercises (will be extended with custom equipment exercises)
export const BASE_EXERCISES: ExerciseDefinition[] = [
  // TRX exercises
  { name: "TRX Row", equipment: "trx" },
  
  // BOSU exercises  
  { name: "BOSU Side Plank Hip Drops", equipment: "bosu" },
  
  // Barbell exercises
  { name: "Barbell Shoulder Press", equipment: "barbell" },
  { name: "Barbell Sit Up", equipment: "barbell" },
  
  // Dumbbell exercises
  { name: "DB Squat Woodchops", equipment: "dumbbells" },
  { name: "Walking Lunge", equipment: "dumbbells" },
  
  // Bodyweight exercises
  { name: "Push-Up", equipment: "bodyweight" },
  { name: "Slow Wide Arm Push Up", equipment: "bodyweight" },
  
  // Cardio equipment
  { name: "Treadmill Run", equipment: "treadmill" },
  { name: "Bike Sprint", equipment: "bike" },
  
  // Bench exercises
  { name: "Incline Press", equipment: "bench" },
  { name: "Bench Press Hold", equipment: "bench" },
  
  // Box exercises
  { name: "Box Step Up", equipment: "box" },
];

// Dynamic exercises storage
let customExercises: ExerciseDefinition[] = [
  // Incline bench exercises
  { name: "Incline Press", equipment: "incline bench" },
  
  // Cable tricep exercises  
  { name: "Tricep", equipment: "cable tricep" },
  
  // Seated row exercises
  { name: "Seated Row", equipment: "seated row" },
];

// Add exercise for custom equipment
export const addExerciseForEquipment = (equipment: string, exerciseName?: string): void => {
  const normalizedEquipment = equipment.toLowerCase().trim();
  
  // Default exercise name if not provided
  const defaultExerciseName = exerciseName || 
    `${equipment.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Exercise`;
  
  const exercise: ExerciseDefinition = {
    name: defaultExerciseName,
    equipment: normalizedEquipment
  };
  
  // Add exercise if it doesn't already exist
  if (!customExercises.some(ex => ex.name === exercise.name && ex.equipment === exercise.equipment)) {
    customExercises.push(exercise);
  }
};

// Get all exercises (base + custom)
export const getAllExercises = (): ExerciseDefinition[] => {
  return [...BASE_EXERCISES, ...customExercises];
};

// For backward compatibility
export const EXERCISES: ExerciseDefinition[] = getAllExercises();
