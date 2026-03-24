-- Brand OS - Social Kit Database Schema
-- Run this in your Supabase SQL editor

-- 1. Brands table (core brand entities)
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT,
    niche TEXT,
    what_you_sell TEXT,
    who_you_help TEXT,
    transformation TEXT,
    difference TEXT,
    emotions TEXT,
    values TEXT,
    personality TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Brand Identities table (visual identity and styling)
CREATE TABLE IF NOT EXISTS public.brand_identities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    color_primary_hex TEXT,
    color_secondary_hex TEXT,
    color_accent_hex TEXT,
    color_palette_description TEXT,
    font_heading TEXT,
    font_body TEXT,
    font_heading_custom_url TEXT,
    font_body_custom_url TEXT,
    logo_primary_url TEXT,
    logo_secondary_url TEXT,
    logo_mark_url TEXT,
    image_style TEXT,
    video_style TEXT,
    do_nots TEXT,
    logo_rules TEXT,
    typography_rules TEXT,
    instagram_bio TEXT,
    brand_book_config JSONB DEFAULT '{}',
    ui_config JSONB DEFAULT '{}',
    content_mix JSONB DEFAULT '[]',
    instagram_highlights JSONB DEFAULT '[]',
    instagram_feed JSONB DEFAULT '[]',
    instagram_tagged JSONB DEFAULT '[]',
    social_connections JSONB DEFAULT '[]',
    youtube_config JSONB DEFAULT '{}',
    tiktok_config JSONB DEFAULT '{}',
    facebook_config JSONB DEFAULT '{}',
    linkedin_config JSONB DEFAULT '{}',
    twitter_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Social Integrations table (OAuth tokens and platform connections)
CREATE TABLE IF NOT EXISTS public.social_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'youtube', 'tiktok', 'linkedin', 'twitter')),
    access_token TEXT NOT NULL,
    platform_user_id TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Brand Assets table (uploaded images, videos, logos, etc.)
CREATE TABLE IF NOT EXISTS public.brand_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    project_id UUID, -- Can be NULL for general brand assets
    asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'document', 'logo', 'font')),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    tags TEXT[],
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'In Review', 'Approved', 'Rejected')),
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Brand Knowledge Base table (for storing brand information and strategy)
CREATE TABLE IF NOT EXISTS public.brand_knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Brand Strategy Sections table
CREATE TABLE IF NOT EXISTS public.brand_strategy_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL,
    content TEXT,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_strategy_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can make these more restrictive later)
CREATE POLICY "Enable all operations for brands" ON public.brands FOR ALL USING (true);
CREATE POLICY "Enable all operations for brand_identities" ON public.brand_identities FOR ALL USING (true);
CREATE POLICY "Enable all operations for social_integrations" ON public.social_integrations FOR ALL USING (true);
CREATE POLICY "Enable all operations for brand_assets" ON public.brand_assets FOR ALL USING (true);
CREATE POLICY "Enable all operations for brand_knowledge_base" ON public.brand_knowledge_base FOR ALL USING (true);
CREATE POLICY "Enable all operations for brand_strategy_sections" ON public.brand_strategy_sections FOR ALL USING (true);