import { z } from 'zod';

// Database Types
export interface Room {
  id: string;
  hotel_id: string;
  name: string;
  qr_slug: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id: string;
  room_id: string;
  user_id?: string;
  status: 'idle' | 'testing' | 'ready' | 'running' | 'paused' | 'done';
  template_slug?: string;
  current_block: number;
  current_exercise: number;
  adaptations: Record<string, any>;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  display_name?: string;
  dob?: string;
  sex?: 'male' | 'female' | 'other';
  height_cm?: number;
  weight_kg?: number;
  body_fat_pct?: number;
  activity_factor: number;
  goal: 'maintain' | 'lose' | 'gain';
  meals_per_day: number;
  created_at: string;
  updated_at: string;
}

export interface FitnessTest {
  id: string;
  user_id: string;
  session_id: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  body_fat_pct?: number;
  level_self: 'beginner' | 'intermediate' | 'advanced';
  max_pushups?: number;
  squats_60s?: number;
  plank_hold_sec?: number;
  step_test_hr?: number;
  computed_level?: number;
  mapped_band?: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export interface Exercise {
  id: string;
  slug: string;
  name: string;
  cues?: string;
  demo_url?: string;
  type: 'strength' | 'mobility' | 'yoga' | 'pilates' | 'conditioning';
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ExerciseBlock {
  name: string;
  slug: string;
  work_s: number;
  rest_s: number;
  easier?: string;
  harder?: string;
  cues?: string;
  demo_url?: string;
}

export interface WorkoutTemplate {
  id: string;
  slug: string;
  title: string;
  category: string;
  level: 'easy' | 'medium' | 'hard';
  duration_min: number;
  blocks: ExerciseBlock[][];
  video_pack?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionEvent {
  id: string;
  session_id: string;
  ts: string;
  event: 'start' | 'pause' | 'resume' | 'skip' | 'harder' | 'easier' | 'complete_block' | 'rep_log';
  payload: Record<string, any>;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  session_id?: string;
  template_slug?: string;
  duration_sec?: number;
  total_reps?: number;
  rpe?: number;
  notes?: string;
  metrics: Record<string, any>;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category: 'breakfast' | 'pre' | 'post' | 'lunch' | 'dinner' | 'snack';
  name: string;
  base_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  price_cents: number;
  options: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MealOrder {
  id: string;
  user_id?: string;
  session_id?: string;
  status: 'queued' | 'in_kitchen' | 'ready' | 'delivered' | 'cancelled';
  total_cents: number;
  macros: Record<string, any>;
  items: OrderItem[];
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  menu_item_id: string;
  qty: number;
  size: 'S' | 'M' | 'L';
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  line_cents: number;
}

export interface Booking {
  id: string;
  user_id?: string;
  room_id?: string;
  room?: {
    id: string;
    name: string;
  };
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'canceled';
  check_in: string;
  check_out: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  package_name?: string;
  party_size?: number;
  special_requests?: string;
  source?: string;
  created_at: string;
  updated_at: string;
}

// Calculation Types
export interface MacroTargets {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  bmr: number;
  tdee: number;
}

export interface FitnessScores {
  pushups: number;
  squats: number;
  plank: number;
  cardio: number;
  overall: number;
  level: 'easy' | 'medium' | 'hard';
}

// Zod Validation Schemas
export const CreateSessionSchema = z.object({
  room_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  template_slug: z.string().optional(),
});

export const SessionEventSchema = z.object({
  event: z.enum(['start', 'pause', 'resume', 'skip', 'harder', 'easier', 'complete_block', 'rep_log']),
  payload: z.record(z.string(), z.any()).default({}),
});

export const FitnessTestSchema = z.object({
  user_id: z.string().uuid().optional(),
  session_id: z.string().uuid(),
  age: z.number().int().min(13).max(120),
  height_cm: z.number().min(120).max(250),
  weight_kg: z.number().min(30).max(300),
  body_fat_pct: z.number().min(3).max(50).optional(),
  sex: z.enum(['male', 'female', 'other']),
  level_self: z.enum(['beginner', 'intermediate', 'advanced']),
  max_pushups: z.number().int().min(0).max(200).optional(),
  squats_60s: z.number().int().min(0).max(200).optional(),
  plank_hold_sec: z.number().int().min(0).max(600).optional(),
  step_test_hr: z.number().int().min(60).max(220).optional(),
});

export const MacroCalcSchema = z.object({
  age: z.number().int().min(13).max(120),
  sex: z.enum(['male', 'female', 'other']),
  height_cm: z.number().min(120).max(250),
  weight_kg: z.number().min(30).max(300),
  activity_factor: z.number().min(1.2).max(2.0).default(1.4),
  goal: z.enum(['maintain', 'lose', 'gain']).default('maintain'),
  body_fat_pct: z.number().min(3).max(50).optional(),
});

export const CreateOrderSchema = z.object({
  user_id: z.string().uuid().optional(),
  session_id: z.string().uuid().optional(),
  items: z.array(z.object({
    menu_item_id: z.string().uuid(),
    qty: z.number().int().min(1).max(10),
    size: z.enum(['S', 'M', 'L']).default('M'),
  })),
  special_instructions: z.string().max(500).optional(),
});

const isoDateString = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  { message: 'Invalid date string' }
);

export const CreateBookingSchema = z.object({
  userId: z.string().uuid(),
  roomId: z.string().uuid(),
  checkIn: isoDateString,
  checkOut: isoDateString,
  guestName: z.string().min(1, 'Guest name required'),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  packageName: z.string().optional(),
  partySize: z.number().int().min(1).max(6).optional(),
  specialRequests: z.string().max(500).optional(),
  source: z.string().optional(),
});

// Workout State Types
export interface WorkoutState {
  session: WorkoutSession;
  template?: WorkoutTemplate;
  currentBlock: number;
  currentExercise: number;
  phase: 'work' | 'rest';
  timeLeft: number;
  totalTime: number;
  adaptations: Record<string, number>; // exercise slug -> difficulty adjustment
}

export interface RemoteState {
  connected: boolean;
  sessionId: string;
  currentExercise?: string;
  phase: 'work' | 'rest';
  timeLeft: number;
  canStart: boolean;
  canPause: boolean;
  canSkip: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface SessionStateResponse {
  session: WorkoutSession;
  template?: WorkoutTemplate;
  currentBlock: number;
  currentExercise: number;
  phase: 'work' | 'rest';
  timeLeft: number;
  adaptations: Record<string, number>;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type CreateType<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
export type UpdateType<T> = DeepPartial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;

// Constants
export const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
} as const;

export const MACRO_SPLITS = {
  cutting: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  maintain: { protein: 0.25, carbs: 0.45, fat: 0.3 },
  bulking: { protein: 0.25, carbs: 0.5, fat: 0.25 },
} as const;

export const FITNESS_THRESHOLDS = {
  pushups: { easy: 15, medium: 30, hard: 50 },
  squats_60s: { easy: 25, medium: 40, hard: 60 },
  plank_sec: { easy: 60, medium: 120, hard: 180 },
  step_recovery_hr: { easy: 110, medium: 90, hard: 70 }, // lower is better
} as const;
