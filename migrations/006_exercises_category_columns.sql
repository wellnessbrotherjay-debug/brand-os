-- Add category columns to exercises table for program builder filtering
-- These mirror the BodyPart / MovementType types in exercise-library.ts

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS body_part TEXT CHECK (
    body_part IN ('upper', 'lower', 'core', 'full_body')
  ),
  ADD COLUMN IF NOT EXISTS movement_type TEXT CHECK (
    movement_type IN ('push', 'pull', 'hinge', 'squat', 'carry', 'cardio')
  ),
  ADD COLUMN IF NOT EXISTS equipment TEXT;

-- Add indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_exercises_body_part    ON public.exercises(body_part) WHERE body_part IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exercises_movement_type ON public.exercises(movement_type) WHERE movement_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exercises_equipment     ON public.exercises(equipment) WHERE equipment IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exercises_demo_url      ON public.exercises(demo_url) WHERE demo_url IS NOT NULL;

-- Seed body_part / movement_type / equipment for the 25 exercises
-- that were previously in the hard-coded library, using slug as the key.
-- You can extend this UPDATE for the rest of the 300+ library.

UPDATE public.exercises SET body_part = 'upper',     movement_type = 'pull',   equipment = 'dumbbells'  WHERE slug = 'alt-hammer-curls';
UPDATE public.exercises SET body_part = 'upper',     movement_type = 'pull',   equipment = 'dumbbells'  WHERE slug = 'renegade-row';
UPDATE public.exercises SET body_part = 'full_body', movement_type = 'squat',  equipment = 'dumbbells'  WHERE slug = 'db-squat-woodchops';
UPDATE public.exercises SET body_part = 'upper',     movement_type = 'push',   equipment = 'dumbbells'  WHERE slug = 'db-tricep-kickback';
UPDATE public.exercises SET body_part = 'upper',     movement_type = 'push',   equipment = 'barbell'    WHERE slug = 'barbell-shoulder-press';
UPDATE public.exercises SET body_part = 'core',      movement_type = 'carry',  equipment = 'barbell'    WHERE slug = 'barbell-sit-up';
UPDATE public.exercises SET body_part = 'lower',     movement_type = 'squat',  equipment = 'barbell'    WHERE slug = 'barbell-front-squat-back-lunge';
UPDATE public.exercises SET body_part = 'upper',     movement_type = 'push',   equipment = 'bench'      WHERE slug = 'band-bench-press';
UPDATE public.exercises SET body_part = 'upper',     movement_type = 'push',   equipment = 'band'       WHERE slug = 'band-single-arm-tricep-extension';
UPDATE public.exercises SET body_part = 'upper',     movement_type = 'pull',   equipment = 'band'       WHERE slug = 'band-seated-lat-pull-down';
UPDATE public.exercises SET body_part = 'lower',     movement_type = 'squat',  equipment = 'dumbbells'  WHERE slug = 'walking-lunge';
UPDATE public.exercises SET body_part = 'upper',     movement_type = 'push',   equipment = 'bodyweight' WHERE slug = 'push-up';
UPDATE public.exercises SET body_part = 'upper',     movement_type = 'push',   equipment = 'bodyweight' WHERE slug = 'slow-wide-arm-push-up';
UPDATE public.exercises SET body_part = 'upper',     movement_type = 'pull',   equipment = 'trx'        WHERE slug = 'trx-row';
UPDATE public.exercises SET body_part = 'core',      movement_type = 'carry',  equipment = 'trx'        WHERE slug = 'trx-pike';
UPDATE public.exercises SET body_part = 'core',      movement_type = 'carry',  equipment = 'bosu'       WHERE slug = 'bosu-side-plank-hip-drops';
UPDATE public.exercises SET body_part = 'core',      movement_type = 'carry',  equipment = 'bosu'       WHERE slug = 'bosu-knee-tuck';
UPDATE public.exercises SET body_part = 'core',      movement_type = 'carry',  equipment = 'bosu'       WHERE slug = 'bosu-russian-twists';
UPDATE public.exercises SET body_part = 'lower',     movement_type = 'squat',  equipment = 'box'        WHERE slug = 'box-step-up';
UPDATE public.exercises SET body_part = 'full_body', movement_type = 'cardio', equipment = 'box'        WHERE slug = 'box-jump-burpee';
UPDATE public.exercises SET body_part = 'upper',     movement_type = 'push',   equipment = 'bench'      WHERE slug = 'incline-press';
UPDATE public.exercises SET body_part = 'upper',     movement_type = 'push',   equipment = 'bench'      WHERE slug = 'bench-press-hold';
UPDATE public.exercises SET body_part = 'full_body', movement_type = 'cardio', equipment = 'treadmill'  WHERE slug = 'treadmill-run';
UPDATE public.exercises SET body_part = 'full_body', movement_type = 'cardio', equipment = 'bike'       WHERE slug = 'bike-sprint';
UPDATE public.exercises SET body_part = 'full_body', movement_type = 'hinge',  equipment = 'barbell'    WHERE slug = 'reverse-grip-deadlift-into-row';
