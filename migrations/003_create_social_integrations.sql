
-- Create social_integrations table
CREATE TABLE IF NOT EXISTS social_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  platform_user_id TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE social_integrations ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on social_integrations" ON social_integrations
FOR ALL USING (true);
