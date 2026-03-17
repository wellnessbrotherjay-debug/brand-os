-- Fix global_timer to ensure it's always active
-- Run this in your Supabase SQL editor

-- First, check if the global_timer table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'global_timer'
    ) THEN
        CREATE TABLE global_timer (
            id TEXT PRIMARY KEY,
            time_left INTEGER DEFAULT 45,
            phase TEXT DEFAULT 'work',
            is_active BOOLEAN DEFAULT true,
            work_time INTEGER DEFAULT 45,
            rest_time INTEGER DEFAULT 15,
            target_end_time TIMESTAMPTZ,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- Ensure the active timer exists and is active
INSERT INTO global_timer (id, time_left, phase, is_active, work_time, rest_time, target_end_time)
VALUES ('active', 45, 'work', true, 45, 15, NOW() + INTERVAL '45 seconds')
ON CONFLICT (id) DO UPDATE SET
    is_active = true,
    target_end_time = COALESCE(global_timer.target_end_time, NOW() + INTERVAL '45 seconds'),
    updated_at = NOW();

-- Enable real-time for global_timer table
ALTER PUBLICATION supabase_realtime ADD TABLE global_timer;

-- Create a function to ensure timer is always active
CREATE OR REPLACE FUNCTION ensure_timer_active()
RETURNS TRIGGER AS $$
BEGIN
    -- If is_active is being set to false, force it to true
    IF NEW.is_active = false THEN
        NEW.is_active = true;
    END IF;

    -- Always update updated_at
    NEW.updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS ensure_global_timer_active ON global_timer;
CREATE TRIGGER ensure_global_timer_active
    BEFORE UPDATE ON global_timer
    FOR EACH ROW
    EXECUTE FUNCTION ensure_timer_active();

-- Verify the timer is active
SELECT * FROM global_timer WHERE id = 'active';
