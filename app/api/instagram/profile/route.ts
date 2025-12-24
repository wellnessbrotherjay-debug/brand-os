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

        // Step 1: Get Instagram Business Account ID from the Page
        const pageResponse = await fetch(
            `${GRAPH_API}/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
        );

        if (!pageResponse.ok) {
            const errorData = await pageResponse.json();
            return NextResponse.json(
                { error: 'Failed to fetch Instagram Business Account', details: errorData },
                { status: pageResponse.status }
            );
        }

        const pageData = await pageResponse.json();
        const igBusinessAccountId = pageData.instagram_business_account?.id;

        if (!igBusinessAccountId) {
            return NextResponse.json(
                { error: 'No Instagram Business Account linked to this Facebook Page' },
                { status: 404 }
            );
        }

        // Step 2: Get Instagram profile data
        const profileResponse = await fetch(
            `${GRAPH_API}/${igBusinessAccountId}?fields=username,profile_picture_url,followers_count,follows_count,media_count,biography,website&access_token=${accessToken}`
        );

        if (!profileResponse.ok) {
            const errorData = await profileResponse.json();
            return NextResponse.json(
                { error: 'Failed to fetch Instagram profile data', details: errorData },
                { status: profileResponse.status }
            );
        }

        const profileData = await profileResponse.json();

        return NextResponse.json({
            success: true,
            igBusinessAccountId,
            profile: {
                username: profileData.username,
                profilePictureUrl: profileData.profile_picture_url,
                followersCount: profileData.followers_count,
                followsCount: profileData.follows_count,
                mediaCount: profileData.media_count,
                biography: profileData.biography || '',
                website: profileData.website || ''
            }
        });

    } catch (error: any) {
        console.error('[Instagram Profile API Error]:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
