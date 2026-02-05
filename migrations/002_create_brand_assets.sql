
-- Create brand_assets table
CREATE TABLE IF NOT EXISTS brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  project_id UUID,
  asset_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  tags TEXT[],
  status TEXT DEFAULT 'Draft',
  target_platforms TEXT[],
  scheduled_date TIMESTAMP WITH TIME ZONE,
  feedback_comments JSONB,
  compliance_report JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on brand_assets" ON brand_assets
FOR ALL USING (true);
