-- 0. Prerequisites (Libraries)
CREATE TABLE IF NOT EXISTS public.equipment_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_name TEXT NOT NULL,
    category TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.exercise_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exercise_name TEXT NOT NULL,
    primary_muscle_group TEXT,
    required_equipment TEXT,
    difficulty_level TEXT,
    intensity TEXT,
    training_type TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Libraries
ALTER TABLE public.equipment_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public equipment view" ON public.equipment_library;
CREATE POLICY "Public equipment view" ON public.equipment_library FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public exercises view" ON public.exercise_library;
CREATE POLICY "Public exercises view" ON public.exercise_library FOR SELECT USING (true);


-- 1. Workout Programs (e.g., "Sculpt & Shape", "Lean & Burn")
CREATE TABLE IF NOT EXISTS public.workout_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    level TEXT CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
    category TEXT NOT NULL, -- 'Sculpt', 'Strength', 'Burn', 'Flow', etc.
    duration_weeks INTEGER DEFAULT 4,
    frequency_per_week INTEGER DEFAULT 4,
    cover_image_url TEXT,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. individual Workouts (e.g., "Lower Body Blast")
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    program_id UUID REFERENCES public.workout_programs(id),
    difficulty_level TEXT,
    estimated_duration_min INTEGER,
    cover_image_url TEXT,
    video_url TEXT, -- Full walkthrough video if applicable
    warmup_duration_min INTEGER DEFAULT 5,
    cooldown_duration_min INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Workout Exercises (Join table linking Workouts <-> Exercise Library)
-- Note: Requires `exercise_library` from previous migration (assumed existing based on types)
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES public.exercise_library(id), -- Connects to existing library
    order_index INTEGER NOT NULL, -- 1, 2, 3...
    sets INTEGER DEFAULT 3,
    reps_target TEXT, -- "12" or "12-15"
    time_target_sec INTEGER, -- If time based
    rest_sec INTEGER DEFAULT 60,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. User Schedule / Diary
CREATE TABLE IF NOT EXISTS public.user_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    item_type TEXT CHECK (item_type IN ('workout', 'meal', 'class')),
    reference_id UUID, -- ID of the workout or class
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. User Workout SESSIONS (An active instance of doing a workout)
CREATE TABLE IF NOT EXISTS public.user_workout_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES public.workouts(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. User Workout LOGS (The actual sets/reps performed)
CREATE TABLE IF NOT EXISTS public.user_workout_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.user_workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID, -- Denormalized for easier querying
    set_number INTEGER NOT NULL,
    weight_kg NUMERIC,
    reps_completed INTEGER,
    rpe INTEGER, -- Rate of Perceived Exertion (1-10)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Nutrition: Daily Summaries
CREATE TABLE IF NOT EXISTS public.nutrition_daily_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_calories INTEGER DEFAULT 0,
    total_protein_g INTEGER DEFAULT 0,
    total_carbs_g INTEGER DEFAULT 0,
    total_fats_g INTEGER DEFAULT 0,
    water_ml INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- 8. Nutrition: Meal Entries
CREATE TABLE IF NOT EXISTS public.nutrition_meal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    daily_log_id UUID REFERENCES public.nutrition_daily_logs(id) ON DELETE CASCADE,
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_name TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit TEXT DEFAULT 'serving',
    calories INTEGER,
    protein_g INTEGER,
    carbs_g INTEGER,
    fats_g INTEGER,
    usda_fdc_id TEXT, -- Reference ID to USDA database if matched
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Security Policies (RLS)

-- Helper to enable RLS on table
ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_meal_entries ENABLE ROW LEVEL SECURITY;


-- Public Read for Programs/Workouts (Everyone can see content)
DROP POLICY IF EXISTS "Public programs are viewable by everyone" ON public.workout_programs;
CREATE POLICY "Public programs are viewable by everyone" ON public.workout_programs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public workouts are viewable by everyone" ON public.workouts;
CREATE POLICY "Public workouts are viewable by everyone" ON public.workouts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public workout exercises are viewable by everyone" ON public.workout_exercises;
CREATE POLICY "Public workout exercises are viewable by everyone" ON public.workout_exercises FOR SELECT USING (true);

-- User Private Data (Schedule, Sessions, Logs, Nutrition)
DROP POLICY IF EXISTS "Users can view own schedule" ON public.user_schedule;
CREATE POLICY "Users can view own schedule" ON public.user_schedule FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own schedule" ON public.user_schedule;
CREATE POLICY "Users can insert own schedule" ON public.user_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own schedule" ON public.user_schedule;
CREATE POLICY "Users can update own schedule" ON public.user_schedule FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_workout_sessions;
CREATE POLICY "Users can view own sessions" ON public.user_workout_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_workout_sessions;
CREATE POLICY "Users can insert own sessions" ON public.user_workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_workout_sessions;
CREATE POLICY "Users can update own sessions" ON public.user_workout_sessions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own logs" ON public.user_workout_logs;
CREATE POLICY "Users can view own logs" ON public.user_workout_logs FOR SELECT USING (
    session_id IN (SELECT id FROM public.user_workout_sessions WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own logs" ON public.user_workout_logs;
CREATE POLICY "Users can insert own logs" ON public.user_workout_logs FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM public.user_workout_sessions WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view own nutrition" ON public.nutrition_daily_logs;
CREATE POLICY "Users can view own nutrition" ON public.nutrition_daily_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own nutrition" ON public.nutrition_daily_logs;
CREATE POLICY "Users can insert own nutrition" ON public.nutrition_daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own nutrition" ON public.nutrition_daily_logs;
CREATE POLICY "Users can update own nutrition" ON public.nutrition_daily_logs FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own meals" ON public.nutrition_meal_entries;
CREATE POLICY "Users can view own meals" ON public.nutrition_meal_entries FOR SELECT USING (
    daily_log_id IN (SELECT id FROM public.nutrition_daily_logs WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own meals" ON public.nutrition_meal_entries;
CREATE POLICY "Users can insert own meals" ON public.nutrition_meal_entries FOR INSERT WITH CHECK (
    daily_log_id IN (SELECT id FROM public.nutrition_daily_logs WHERE user_id = auth.uid())
);
