-- Seed Data for Fitness App
-- Description: Populates the database with initial Categories, Programs, Exercises, and Workouts.
-- UUIDs updated to be valid hex-based UUIDs.

-- 0. Schema Update (Instructions)
ALTER TABLE public.exercise_library ADD COLUMN IF NOT EXISTS instructions TEXT;

-- 1. Populate Exercise Library
INSERT INTO public.exercise_library (id, exercise_name, primary_muscle_group, difficulty_level, training_type, video_url, instructions) VALUES
('e1000000-0000-0000-0000-000000000001', 'Dumbbell Thrusters', 'Full Body', 'Intermediate', 'Strength', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'Hold dumbbells at shoulder height. Squat down deep, keeping chest up. Explode up and press the weights overhead fully.'),
('e1000000-0000-0000-0000-000000000002', 'Burpees', 'Full Body', 'Intermediate', 'HIIT', NULL, 'Drop to the floor, chest to ground. Jump back feet to hands. Jump up and clap behind your head.'),
('e1000000-0000-0000-0000-000000000003', 'Push Ups', 'Chest', 'Beginner', 'Strength', NULL, 'Keep body in a straight line. Lower chest to floor. Push back up.'),
('e1000000-0000-0000-0000-000000000004', 'Goblet Squats', 'Legs', 'Beginner', 'Strength', NULL, 'Hold weight at chest. Squat down keeping knees out. Drive back up.'),
('e1000000-0000-0000-0000-000000000005', 'Plank Hold', 'Core', 'Beginner', 'Stability', NULL, 'Hold a straight line on elbows and toes. Brace core.'),
('e1000000-0000-0000-0000-000000000006', 'Mountain Climbers', 'Core', 'Intermediate', 'HIIT', NULL, 'In plank position, drive knees to chest alternately and quickly.')
ON CONFLICT (id) DO NOTHING;

-- 2. Create Programs (IDs starting with 'a' for Programs)
INSERT INTO public.workout_programs (id, title, description, level, category, cover_image_url) VALUES
('a1000000-0000-0000-0000-000000000001', 'Sculpt & Tone', 'A 4-week program designed to define muscles and improve stability.', 'Beginner', 'Sculpt', '/category-covers/sculpt-pink.png'),
('a1000000-0000-0000-0000-000000000002', 'High Octane Burn', 'Intensity focused HIIT sessions to maximize calorie burn.', 'Advanced', 'Burn', '/category-covers/burn-purple.png')
ON CONFLICT (id) DO NOTHING;

-- 3. Create Workouts (IDs starting with 'b' for Workouts)
-- Workout A for Sculpt
INSERT INTO public.workouts (id, program_id, title, description, difficulty_level, estimated_duration_min, cover_image_url) VALUES
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Lower Body Foundation', 'Focus on glutes and quads with controlled movements.', 'Beginner', 30, '/class-covers/glutes-workout.png'),
-- Workout B for Burn
('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Metabolic Fire', 'High intensity intervals to spike heart rate.', 'Advanced', 45, '/class-covers/abs-blast.png')
ON CONFLICT (id) DO NOTHING;

-- 4. Link Exercises to Workouts
-- Lower Body Foundation Exercises
INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, sets, reps_target, rest_sec) VALUES
('b1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000004', 1, 3, '12', 60), -- Squats
('b1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 2, 3, '10', 60), -- Thrusters
('b1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000005', 3, 2, '60 sec', 45) -- Plank
ON CONFLICT DO NOTHING;

-- Metabolic Fire Exercises
INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, sets, reps_target, rest_sec) VALUES
('b1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', 1, 4, '15', 30), -- Burpees
('b1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000006', 2, 4, '45 sec', 30), -- Mountain Climbers
('b1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 3, 4, '12', 45) -- Thrusters
ON CONFLICT DO NOTHING;

-- 5. Force Update Video URL (in case row already existed)
UPDATE public.exercise_library 
SET video_url = '5d5bc37ffcf54c9b82e996823bffbb81' -- Placeholder Cloudflare Video ID
WHERE id = 'e1000000-0000-0000-0000-000000000001';


