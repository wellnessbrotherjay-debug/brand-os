-- Create workouts table for storing workout plans
CREATE TABLE IF NOT EXISTS workouts (
  id VARCHAR(50) PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a default row for the active workout
INSERT INTO workouts (id, data) VALUES ('active', '{}') 
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (you can make this more restrictive later)
CREATE POLICY "Allow all operations on workouts" ON workouts
FOR ALL USING (true);