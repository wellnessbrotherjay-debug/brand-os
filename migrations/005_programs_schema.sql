-- 10-Day Program Schema
-- Programs group 10 daily workouts together and auto-push to displays

CREATE TABLE IF NOT EXISTS public.programs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL DEFAULT 'Untitled Program',
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  is_active     BOOLEAN DEFAULT FALSE,
  venue_id      TEXT -- optional venue scoping
);

-- Each row = one day in a program (day 1-10)
CREATE TABLE IF NOT EXISTS public.program_days (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id    UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  day_number    INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 10),
  workout_name  TEXT NOT NULL DEFAULT 'Day Workout',
  goal          TEXT NOT NULL DEFAULT 'Fat Loss',
  studio_mode   TEXT NOT NULL DEFAULT 'studio-a',
  data          JSONB NOT NULL DEFAULT '{}', -- Full WorkoutPlan JSON
  scheduled_date DATE,
  UNIQUE(program_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_program_days_program_id ON public.program_days(program_id);
CREATE INDEX IF NOT EXISTS idx_program_days_scheduled_date ON public.program_days(scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_programs_is_active ON public.programs(is_active) WHERE is_active IS TRUE;

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS programs_updated_at ON public.programs;
CREATE TRIGGER programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
