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
        const brandId = searchParams.get('brandId');

        if (!brandId) {
            return NextResponse.json(
                { error: 'Missing required parameter: brandId' },
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

        // Fetch user's Facebook Pages
        const pagesResponse = await fetch(
            `${GRAPH_API}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`
        );

        if (!pagesResponse.ok) {
            const errorData = await pagesResponse.json();
            return NextResponse.json(
                { error: 'Failed to fetch Facebook Pages', details: errorData },
                { status: pagesResponse.status }
            );
        }

        const pagesData = await pagesResponse.json();

        // Format pages data
        const pages = pagesData.data?.map((page: any) => ({
            id: page.id,
            name: page.name,
            accessToken: page.access_token,
            hasInstagram: !!page.instagram_business_account,
            instagramBusinessAccountId: page.instagram_business_account?.id || null
        })) || [];

        return NextResponse.json({
            success: true,
            pages
        });

    } catch (error: any) {
        console.error('[Facebook Pages API Error]:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
