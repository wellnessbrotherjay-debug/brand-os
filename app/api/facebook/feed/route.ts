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
        const limit = searchParams.get('limit') || '10';

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

        // Fetch Facebook Page Feed
        // Fields: message, full_picture, created_time, likes.summary(true), comments.summary(true)
        const feedResponse = await fetch(
            `${GRAPH_API}/${pageId}/feed?fields=id,message,full_picture,created_time,likes.summary(true),comments.summary(true),permalink_url&limit=${limit}&access_token=${accessToken}`
        );

        if (!feedResponse.ok) {
            const errorData = await feedResponse.json();
            return NextResponse.json(
                { error: 'Failed to fetch Facebook Page feed', details: errorData },
                { status: feedResponse.status }
            );
        }

        const feedData = await feedResponse.json();

        // Format feed items
        const feed = feedData.data?.filter((item: any) => item.full_picture).map((item: any) => ({
            id: item.id,
            message: item.message || '',
            fullPicture: item.full_picture,
            createdTime: item.created_time,
            permalinkUrl: item.permalink_url,
            // Facebook returns summary inside likes/comments connections for simpler counts
            likesCount: item.likes?.summary?.total_count || 0,
            commentsCount: item.comments?.summary?.total_count || 0
        })) || [];

        return NextResponse.json({
            success: true,
            feed,
            paging: feedData.paging || null
        });

    } catch (error: any) {
        console.error('[Facebook Feed API Error]:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
