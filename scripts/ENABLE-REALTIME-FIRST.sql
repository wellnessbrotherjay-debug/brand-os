-- Enable Supabase Real-time for global_timer table
-- Run this in your Supabase Dashboard → SQL Editor

-- Step 1: Drop existing publication (to start fresh)
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Step 2: Create new publication
CREATE PUBLICATION supabase_realtime;

-- Step 3: Add tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE workouts;
ALTER PUBLICATION supabase_realtime ADD TABLE global_timer;

-- Step 4: Verify it worked
SELECT
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;

-- You should see:
-- schemaname | tablename   | pubname
-- ---------- | ----------- | ----------
-- public    | workouts    | ...
-- public    | global_timer | ...
