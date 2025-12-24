import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const GRAPH_API = 'https://graph.facebook.com/v19.0';

// Initialize Supabase client
const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const pageId = searchParams.get('pageId');
        const brandId = searchParams.get('brandId');

        if (!pageId || !brandId) {
            return NextResponse.json(
                { error: 'Missing required parameters: pageId and brandId' },
                { status: 400 }
            );
        }

        // Get access token from Supabase
        const { data: integration, error: dbError } = await supabase
            .from('social_integrations')
            .select('access_token, token_expires_at')
            .eq('brand_id', brandId)
            .eq('platform', 'facebook')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle() as { data: { access_token: string; token_expires_at: string | null } | null; error: any };

        if (dbError || !integration) {
            return NextResponse.json(
                { error: 'No Facebook connection found for this brand' },
                { status: 404 }
            );
        }

        // Check if token is expired
        if (integration.token_expires_at) {
            const expiresAt = new Date(integration.token_expires_at);
            if (expiresAt < new Date()) {
                return NextResponse.json(
                    { error: 'Access token expired. Please reconnect your account.' },
                    { status: 401 }
                );
            }
        }

        const accessToken = integration.access_token;

        // Fetch Facebook Page Profile
        // Fields: name, about, bio, fan_count, followers_count, website, picture.type(large), cover
        const profileResponse = await fetch(
            `${GRAPH_API}/${pageId}?fields=name,about,bio,fan_count,followers_count,website,picture.type(large),cover&access_token=${accessToken}`
        );

        if (!profileResponse.ok) {
            const errorData = await profileResponse.json();
            return NextResponse.json(
                { error: 'Failed to fetch Facebook Page profile', details: errorData },
                { status: profileResponse.status }
            );
        }

        const profileData = await profileResponse.json();

        return NextResponse.json({
            success: true,
            profile: {
                name: profileData.name,
                about: profileData.about || profileData.bio || '',
                likes: profileData.fan_count || 0,
                followers: profileData.followers_count || 0,
                website: profileData.website || '',
                profilePictureUrl: profileData.picture?.data?.url || '',
                coverPhotoUrl: profileData.cover?.source || ''
            }
        });

    } catch (error: any) {
        console.error('[Facebook Profile API Error]:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
