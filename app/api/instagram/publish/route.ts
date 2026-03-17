import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const GRAPH_API = 'https://graph.facebook.com/v19.0';

// Initialize Supabase client with Service Role Key to bypass RLS
const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { igBusinessAccountId, brandId, mediaUrl, caption, mediaType = 'IMAGE' } = body;

        if (!igBusinessAccountId || !brandId || !mediaUrl) {
            return NextResponse.json(
                { error: 'Missing required parameters: igBusinessAccountId, brandId, and mediaUrl' },
                { status: 400 }
            );
        }

        // 1. Get access token from Supabase
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

        const accessToken = integration.access_token;

        // 2. Create Media Container
        let containerUrl = `${GRAPH_API}/${igBusinessAccountId}/media?access_token=${accessToken}&caption=${encodeURIComponent(caption || '')}`;

        if (mediaType === 'VIDEO' || mediaType === 'REELS') {
            containerUrl += `&video_url=${encodeURIComponent(mediaUrl)}&media_type=REELS`;
        } else {
            containerUrl += `&image_url=${encodeURIComponent(mediaUrl)}`;
        }

        const containerResponse = await fetch(containerUrl, { method: 'POST' });
        const containerData = await containerResponse.json();

        if (containerData.error) {
            return NextResponse.json(
                { error: 'Failed to create media container', details: containerData.error },
                { status: 400 }
            );
        }

        const creationId = containerData.id;

        // 3. For Videos/Reels, we might need to wait for processing. 
        // For simplicity in this first version, we'll try to publish after a short delay or assume it's ready if it's an image.
        // In a production app, we would poll /creationId?fields=status_code

        if (mediaType === 'VIDEO' || mediaType === 'REELS') {
            // Wait for 10 seconds for video processing (Meta recommendation is polling)
            await new Promise(resolve => setTimeout(resolve, 10000));
        }

        // 4. Publish Media Container
        const publishResponse = await fetch(
            `${GRAPH_API}/${igBusinessAccountId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`,
            { method: 'POST' }
        );

        const publishData = await publishResponse.json();

        if (publishData.error) {
            return NextResponse.json(
                { error: 'Failed to publish media', details: publishData.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            id: publishData.id,
            message: 'Post published successfully to Instagram'
        });

    } catch (error: any) {
        console.error('[Instagram Publish API Error]:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
