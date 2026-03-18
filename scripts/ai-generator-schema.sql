-- AI Workout Generator Schema Updates

-- 1. Extend exercise_library with equipment and muscle tags
ALTER TABLE public.exercise_library ADD COLUMN IF NOT EXISTS equipment_tags TEXT[];
ALTER TABLE public.exercise_library ADD COLUMN IF NOT EXISTS muscle_tags TEXT[];

-- Update existing data if metadata exists (migration)
UPDATE public.exercise_library 
SET equipment_tags = ARRAY[metadata->>'equipment'],
    muscle_tags = CAST(ARRAY(SELECT jsonb_array_elements_text(metadata->'muscles')) AS TEXT[])
WHERE metadata ? 'equipment' OR metadata ? 'muscles';

-- 2. Create machine_library for fixed stations tracking
CREATE TABLE IF NOT EXISTS public.machine_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES public.venues(id),
    name TEXT NOT NULL,
    equipment_type TEXT NOT NULL,
    locked BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.machine_library ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public machine_library view" ON public.machine_library;
CREATE POLICY "Public machine_library view" ON public.machine_library FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public machine_library all" ON public.machine_library;
CREATE POLICY "Public machine_library all" ON public.machine_library FOR ALL USING (true) WITH CHECK (true);
