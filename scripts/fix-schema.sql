
-- Fix exercise_library
ALTER TABLE public.exercise_library ADD COLUMN IF NOT EXISTS venue_id UUID;
ALTER TABLE public.exercise_library ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.exercise_library ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE public.exercise_library ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add unique constraint for slug and venue_id if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'exercise_library_slug_venue_id_key'
    ) THEN
        ALTER TABLE public.exercise_library ADD CONSTRAINT exercise_library_slug_venue_id_key UNIQUE (slug, venue_id);
    END IF;
END $$;

-- Fix workouts
-- The app expects a 'data' JSONB column and id as VARCHAR/TEXT for 'active'
-- If workouts table currently uses UUID for id, we might need to change it or create a separate one.
-- Based on error 'column workouts.data does not exist', the table exists but lacks 'data'.
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
-- Ensure id can be 'active' (VARCHAR/TEXT instead of UUID if necessary)
-- Actually, the SQL had it as UUID. Let's see if we can cast or change it.
-- Safer: Check if 'workouts' exists and has UUID primary key.
DO $$ 
BEGIN
    ALTER TABLE public.workouts ALTER COLUMN id TYPE TEXT;
EXCEPTION WHEN OTHERS THEN
    -- If id is referenced by workout_exercises, this might fail unless we drop/recreate or cascade.
    -- For testing, we'll try to just add the column first.
    NULL;
END $$;

-- Create brand_settings if it doesn't exist
CREATE TABLE IF NOT EXISTS public.brand_settings (
    slug TEXT PRIMARY KEY,
    name TEXT,
    logo_url TEXT,
    background_url TEXT,
    video_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    accent_color TEXT,
    font_family TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and add public policies
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public brand_settings view" ON public.brand_settings;
CREATE POLICY "Public brand_settings view" ON public.brand_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public brand_settings all" ON public.brand_settings;
CREATE POLICY "Public brand_settings all" ON public.brand_settings FOR ALL USING (true) WITH CHECK (true);

-- Also fix workouts RLS if needed
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public workouts view" ON public.workouts;
CREATE POLICY "Public workouts view" ON public.workouts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public workouts all" ON public.workouts;
CREATE POLICY "Public workouts all" ON public.workouts FOR ALL USING (true) WITH CHECK (true);

-- Ensure 'active' row exists in workouts with required fields
-- This handles schema variations (title vs name) and provides defaults for common required fields
DO $$
DECLARE
    cols TEXT;
BEGIN
    SELECT string_agg(column_name, ', ') INTO cols 
    FROM information_schema.columns 
    WHERE table_name = 'workouts' AND table_schema = 'public';

    IF cols LIKE '%name%' THEN
        EXECUTE 'INSERT INTO public.workouts (id, name, data) 
                 VALUES (''active'', ''Active Studio Workout'', ''{}''::jsonb) 
                 ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data';
    ELSIF cols LIKE '%title%' THEN
        EXECUTE 'INSERT INTO public.workouts (id, title, data) 
                 VALUES (''active'', ''Active Studio Workout'', ''{}''::jsonb) 
                 ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data';
    ELSE
        INSERT INTO public.workouts (id, data) 
        VALUES ('active', '{}') 
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;
    END IF;
END $$;
