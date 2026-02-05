
-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT DEFAULT 'active',
  bio TEXT,
  country_flag TEXT,
  achievements TEXT[], -- Array of strings
  gallery_images TEXT[], -- Array of strings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access (for now, mirroring workouts policy)
CREATE POLICY "Allow all operations on team_members" ON team_members
FOR ALL USING (true);
