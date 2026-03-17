-- Enable real-time for global_timer table
-- Run this in your Supabase SQL Editor

-- Drop the publication if it exists (to recreate it)
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Recreate the publication with global_timer
CREATE PUBLICATION supabase_realtime;

-- Add all tables that need real-time
ALTER PUBLICATION supabase_realtime ADD TABLE workouts;
ALTER PUBLICATION supabase_realtime ADD TABLE global_timer;

-- Verify the publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
