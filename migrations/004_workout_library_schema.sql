-- Workout Library & Scheduling Schema Updates

-- 1. Add columns to workouts table to support templates and scheduling
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. Ensure existing workouts have a name based on their data if possible
UPDATE public.workouts 
SET name = COALESCE(data->>'name', 'Untitled Workout')
WHERE name IS NULL;

-- 3. Add helper indexes
CREATE INDEX IF NOT EXISTS idx_workouts_scheduled_date ON public.workouts(scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workouts_is_template ON public.workouts(is_template) WHERE is_template IS TRUE;
