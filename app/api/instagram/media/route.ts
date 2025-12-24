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
        const igBusinessAccountId = searchParams.get('igBusinessAccountId');
        const brandId = searchParams.get('brandId');
        const limit = searchParams.get('limit') || '12';

        if (!igBusinessAccountId || !brandId) {
            return NextResponse.json(
                { error: 'Missing required parameters: igBusinessAccountId and brandId' },
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

        // Fetch Instagram media
        const mediaResponse = await fetch(
            `${GRAPH_API}/${igBusinessAccountId}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count&limit=${limit}&access_token=${accessToken}`
        );

        if (!mediaResponse.ok) {
            const errorData = await mediaResponse.json();
            return NextResponse.json(
                { error: 'Failed to fetch Instagram media', details: errorData },
                { status: mediaResponse.status }
            );
        }

        const mediaData = await mediaResponse.json();

        // Format media items
        const media = mediaData.data?.map((item: any) => ({
            id: item.id,
            type: item.media_type?.toLowerCase() || 'image',
            url: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url,
            mediaUrl: item.media_url,
            permalink: item.permalink,
            caption: item.caption || '',
            timestamp: item.timestamp,
            likeCount: item.like_count || 0,
            commentsCount: item.comments_count || 0
        })) || [];

        return NextResponse.json({
            success: true,
            media,
            paging: mediaData.paging || null
        });

    } catch (error: any) {
        console.error('[Instagram Media API Error]:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
