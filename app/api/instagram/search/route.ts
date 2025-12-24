import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const GRAPH_API = 'https://graph.facebook.com/v19.0';

const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const username = searchParams.get('username');
        const brandId = searchParams.get('brandId');

        if (!username || !brandId) {
            return NextResponse.json(
                { error: 'Missing required parameters: username and brandId' },
                { status: 400 }
            );
        }

        // 1. Get an active Facebook integration to use as the "Acting Account"
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
                { error: 'No active Instagram/Facebook connection found for this brand. You need to connect an account first to enable search.' },
                { status: 404 }
            );
        }

        const accessToken = integration.access_token;

        // 2. We need an IG Business Account ID belonging to the token holder to perform discovery
        // First find a page
        const pagesRes = await fetch(`${GRAPH_API}/me/accounts?access_token=${accessToken}`);
        const pagesData = await pagesRes.json();
        const page = pagesData.data?.[0];

        if (!page) {
            return NextResponse.json({ error: 'No Facebook Page found for this token.' }, { status: 404 });
        }

        // Get IG Bus ID for that page
        const igBusIdRes = await fetch(`${GRAPH_API}/${page.id}?fields=instagram_business_account&access_token=${accessToken}`);
        const igBusIdData = await igBusIdRes.json();
        const actingIgId = igBusIdData.instagram_business_account?.id;

        if (!actingIgId) {
            return NextResponse.json({ error: 'No Instagram Business Account linked to the connected Page.' }, { status: 404 });
        }

        // 3. Perform Business Discovery
        const discoveryRes = await fetch(
            `${GRAPH_API}/${actingIgId}?fields=business_discovery.username(${username}){username,website,name,profile_picture_url,biography,followers_count,follows_count,media_count,media{id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count}}&access_token=${accessToken}`
        );

        const discoveryData = await discoveryRes.json();

        if (discoveryData.error) {
            return NextResponse.json({ error: discoveryData.error.message }, { status: 400 });
        }

        const profileData = discoveryData.business_discovery;

        return NextResponse.json({
            success: true,
            profile: {
                username: profileData.username,
                name: profileData.name,
                profilePictureUrl: profileData.profile_picture_url,
                biography: profileData.biography,
                website: profileData.website,
                followersCount: profileData.followers_count,
                followsCount: profileData.follows_count,
                mediaCount: profileData.media_count,
            },
            media: profileData.media?.data?.map((item: any) => ({
                id: item.id,
                type: item.media_type?.toLowerCase() || 'image',
                url: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url,
                mediaUrl: item.media_url,
                permalink: item.permalink,
                caption: item.caption || '',
                timestamp: item.timestamp,
                likeCount: item.like_count || 0,
                commentsCount: item.comments_count || 0
            })) || []
        });

    } catch (error: any) {
        console.error('[Instagram Search API Error]:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
