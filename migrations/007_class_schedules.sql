-- Class Scheduling for Studio A & B
-- Allows assigning a named Program to a specific time slot on a specific day

CREATE TABLE IF NOT EXISTS public.schedules (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id    UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    workout_id    UUID REFERENCES public.workouts(id) ON DELETE CASCADE, -- Link to Legacy Workouts
    workout_name  TEXT, -- Display name (e.g. "Morning Strength")
    studio_id     TEXT NOT NULL CHECK (studio_id IN ('studio-a', 'studio-b')),
    scheduled_day TEXT NOT NULL, -- YYYY-MM-DD
    start_time    TIME NOT NULL, -- HH:MM (e.g. 07:00:00)
    duration_mins INTEGER DEFAULT 60,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for fast lookups by day and studio
CREATE INDEX IF NOT EXISTS idx_schedules_day_studio ON public.schedules(scheduled_day, studio_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE schedules;
