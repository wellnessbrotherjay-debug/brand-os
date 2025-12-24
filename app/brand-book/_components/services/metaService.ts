
// Real Meta Marketing API Layer
import { MetaCampaign, MetaAdSet, MetaAd } from "../types";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

const GRAPH_API = "https://graph.facebook.com/v19.0";

// Helper to get token (In a real app, this might be passed from context or a server action)
// Helper to get token (In a real app, this might be passed from context or a server action)
const getAccessToken = async (brandId: string) => {
    // This is client-side only for demo purposes. Secure calls should be server-side.
    // Assuming we fetch the token for the active brand.
    const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log(`[MetaService] Fetching token for brand: ${brandId}`);
    let token = null;

    try {
        const { data, error } = await supabase
            .from('social_integrations')
            .select('access_token')
            .eq('brand_id', brandId)
            .eq('platform', 'facebook')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (data) token = (data as any).access_token;
        if (error) console.warn("[MetaService] DB Fetch Error:", error);

    } catch (e) {
        console.warn("[MetaService] Supabase connection failed", e);
    }

    // FALLBACK: Check LocalStorage (if DB failed)
    if (!token && typeof window !== 'undefined') {
        const localToken = localStorage.getItem(`exequte_facebook_token_${brandId}`);
        // GUARD: Ensure we don't pick up "undefined" or "null" strings from previous bugs
        if (localToken && localToken !== 'undefined' && localToken !== 'null') {
            console.log("[MetaService] Found token in LocalStorage (Fallback Active)");
            token = localToken;
        }
    }

    console.log(`[MetaService] Token found? ${!!token}`);
    return token;
};

export const syncMetaInsights = async (accountId: string, brandId: string) => {
    console.log(`Syncing insights for account ${accountId}`);
    const token = await getAccessToken(brandId);
    if (!token) throw new Error("No Facebook connection found for this brand.");

    const res = await fetch(`${GRAPH_API}/${accountId}/insights?date_preset=maximum&fields=spend,impressions,clicks,cpc,ctr,actions&access_token=${token}`);
    const data = await res.json();
    return data;
}

export const createMetaCampaign = async (campaign: Omit<MetaCampaign, 'id' | 'spend' | 'results' | 'cpr' | 'roas'>, brandId: string): Promise<MetaCampaign> => {
    const token = await getAccessToken(brandId);
    if (!token) throw new Error("No Facebook connection found.");

    // See: https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group
    const res = await fetch(`${GRAPH_API}/${campaign.account_id}/campaigns?access_token=${token}`, {
        method: 'POST',
        body: JSON.stringify({
            name: campaign.name,
            objective: campaign.objective,
            status: campaign.status,
            special_ad_categories: [] // Required for v19+
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    const responseData = await res.json();
    if (responseData.error) throw new Error(responseData.error.message);

    return {
        id: responseData.id,
        ...campaign,
        spend: 0,
        results: 0,
        cpr: 0,
        roas: 0
    };
}

export const createMetaAdSet = async (adSet: Omit<MetaAdSet, 'id' | 'spend' | 'impressions' | 'clicks'>, brandId: string): Promise<MetaAdSet> => {
    const token = await getAccessToken(brandId);
    if (!token) throw new Error("No Facebook connection found.");

    const res = await fetch(`${GRAPH_API}/${adSet.campaign_id}/adsets?access_token=${token}`, {
        method: 'POST',
        body: JSON.stringify({
            name: adSet.name,
            daily_budget: adSet.daily_budget * 100, // Cents
            billing_event: 'IMPRESSIONS',
            optimization_goal: 'REACH',
            bid_amount: 100,
            targeting: adSet.targeting,
            status: adSet.status
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    const responseData = await res.json();
    if (responseData.error) throw new Error(responseData.error.message);

    return {
        id: responseData.id,
        ...adSet,
        spend: 0,
        impressions: 0,
        clicks: 0
    };
}

export const createMetaAd = async (ad: Omit<MetaAd, 'id' | 'spend' | 'ctr' | 'cpc'>, brandId: string): Promise<MetaAd> => {
    const token = await getAccessToken(brandId);
    if (!token) throw new Error("No Facebook connection found.");

    const res = await fetch(`${GRAPH_API}/${ad.adset_id}/ads?access_token=${token}`, {
        method: 'POST',
        body: JSON.stringify({
            name: ad.name,
            creative: { creative_id: ad.creative_id },
            status: ad.status
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    const responseData = await res.json();
    if (responseData.error) throw new Error(responseData.error.message);

    return {
        id: responseData.id,
        ...ad,
        spend: 0,
        ctr: 0,
        cpc: 0
    };
}

export const suggestCampaignName = (brandName: string, objective: string, date: Date) => {
    const objCode = objective.split('_')[1] || 'GEN';
    const dateStr = date.toISOString().split('T')[0];
    return `${brandName.toUpperCase()} - ${objCode} - ${dateStr}`;
}

export const getMetaAccounts = async (brandId: string) => {
    const token = await getAccessToken(brandId);
    if (!token) return [];

    console.log("[MetaService] Fetching Ad Accounts...");

    // Strategy 1: Direct Ad Accounts (Assigned to User)
    let allAccounts: any[] = [];

    try {
        const res = await fetch(`${GRAPH_API}/me/adaccounts?fields=name,account_id,currency,timezone_name,account_status&limit=50&access_token=${token}`);
        const data = await res.json();

        if (data.error) {
            console.error("[MetaService] Direct fetch error:", data.error);
            if (data.error.code === 190 || data.error.code === 100 || data.error.type === 'OAuthException') {
                throw new Error("AUTH_EXPIRED");
            }
        }

        if (data.data) {
            allAccounts = [...data.data];
        }
    } catch (e: any) {
        if (e.message === "AUTH_EXPIRED") throw e;
        console.warn("[MetaService] Direct Ad Accounts fetch failed", e);
    }

    // Strategy 2: Business Manager Accounts (If user has business_management)
    // Sometimes 'me/adaccounts' doesn't show everything if permissions are weird.
    try {
        const bizRes = await fetch(`${GRAPH_API}/me/businesses?fields=id,name,client_ad_accounts{name,account_id,currency,timezone_name,account_status},owned_ad_accounts{name,account_id,currency,timezone_name,account_status}&access_token=${token}`);
        const bizData = await bizRes.json();

        if (bizData.data) {
            bizData.data.forEach((biz: any) => {
                if (biz.owned_ad_accounts?.data) allAccounts.push(...biz.owned_ad_accounts.data);
                if (biz.client_ad_accounts?.data) allAccounts.push(...biz.client_ad_accounts.data);
            });
        }
    } catch (e: any) {
        if (e.message === "AUTH_EXPIRED") throw e;
        console.warn("[MetaService] Business fetch failed", e);
    }

    // Deduplicate by account_id
    const uniqueAccounts = Array.from(new Map(allAccounts.map(item => [item.account_id, item])).values());

    console.log(`[MetaService] Total Unique Accounts Found: ${uniqueAccounts.length}`);

    return uniqueAccounts.map((acc: any) => ({
        id: `act_${acc.account_id}`,
        brand_id: brandId,
        name: acc.name || `Account ${acc.account_id}`,
        currency: acc.currency,
        status: acc.account_status === 1 ? 'ACTIVE' : 'INACTIVE',
        timezone_name: acc.timezone_name
    }));
};

export const getMetaCampaigns = async (accountId: string, brandId: string) => {
    const token = await getAccessToken(brandId);
    if (!token) return [];

    const res = await fetch(`${GRAPH_API}/${accountId}/campaigns?fields=id,name,objective,status,special_ad_categories&access_token=${token}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    // Fetch insights for each to get spend/results (batching would be better but keeping simple)
    const enriched = await Promise.all(data.data.map(async (cmp: any) => {
        const insightsRes = await fetch(`${GRAPH_API}/${cmp.id}/insights?fields=spend,actions,action_values,cpc&date_preset=maximum&access_token=${token}`);
        const insightsData = await insightsRes.json();
        const stats = insightsData.data?.[0] || {};

        return {
            id: cmp.id,
            account_id: accountId,
            name: cmp.name,
            objective: cmp.objective,
            // Map status correctly based on Meta API string values
            status: cmp.status as MetaCampaign['status'],
            spend: parseFloat(stats.spend || 0),
            results: 0, // Simplified: parsing actions needs more logic
            cpr: 0,
            roas: 0
        };
    }));

    return enriched;
};

export const getMetaAdSets = async (accountId: string, brandId: string) => {
    const token = await getAccessToken(brandId);
    if (!token) return [];

    const res = await fetch(`${GRAPH_API}/${accountId}/adsets?fields=id,campaign_id,name,status,daily_budget,targeting,billing_event,optimization_goal,bid_amount&access_token=${token}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const enriched = await Promise.all(data.data.map(async (aset: any) => {
        const insightsRes = await fetch(`${GRAPH_API}/${aset.id}/insights?fields=spend,impressions,clicks&date_preset=maximum&access_token=${token}`);
        const stats = (await insightsRes.json()).data?.[0] || {};

        return {
            id: aset.id,
            campaign_id: aset.campaign_id,
            name: aset.name,
            status: aset.status,
            daily_budget: parseInt(aset.daily_budget || 0) / 100,
            spend: parseFloat(stats.spend || 0),
            impressions: parseInt(stats.impressions || 0),
            clicks: parseInt(stats.clicks || 0),
            targeting: aset.targeting
        };
    }));

    return enriched;
};

export const getMetaAds = async (accountId: string, brandId: string) => {
    const token = await getAccessToken(brandId);
    if (!token) return [];

    const res = await fetch(`${GRAPH_API}/${accountId}/ads?fields=id,adset_id,name,status,creative&access_token=${token}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const enriched = await Promise.all(data.data.map(async (ad: any) => {
        const insightsRes = await fetch(`${GRAPH_API}/${ad.id}/insights?fields=spend,cpc,ctr&date_preset=maximum&access_token=${token}`);
        const stats = (await insightsRes.json()).data?.[0] || {};

        // Get creative data
        const creativeRes = await fetch(`${GRAPH_API}/${ad.creative.id}?fields=thumbnail_url,image_url,title,body&access_token=${token}`);
        const creative = await creativeRes.json();

        return {
            id: ad.id,
            adset_id: ad.adset_id,
            name: ad.name,
            status: ad.status,
            creative_id: ad.creative.id,
            image_url: creative.image_url || creative.thumbnail_url || '',
            primary_text: creative.body || '',
            headline: creative.title || '',
            spend: parseFloat(stats.spend || 0),
            ctr: parseFloat(stats.ctr || 0),
            cpc: parseFloat(stats.cpc || 0)
        };
    }));

    return enriched;
};

// --- INSTAGRAM BIO & BUSINESS DISCOVERY ---

// 1. Get the IG Business Account ID linked to the user's Page
export const getInstagramBusinessAccountId = async (pageId: string, brandId: string) => {
    const token = await getAccessToken(brandId);
    if (!token) return null;

    try {
        const res = await fetch(`${GRAPH_API}/${pageId}?fields=instagram_business_account&access_token=${token}`);
        const data = await res.json();
        return data.instagram_business_account?.id || null;
    } catch (e) {
        console.error("Failed to get IG Business ID", e);
        return null;
    }
};

// 2. Search for Instagram Accounts (Business Discovery)
export const searchInstagramByHandle = async (username: string, brandId: string) => {
    try {
        const response = await fetch(`/api/instagram/search?username=${username}&brandId=${brandId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to search Instagram account');
        }

        return data;
    } catch (error: any) {
        console.error('[searchInstagramByHandle Error]:', error);
        throw error;
    }
};

// DEBUG TOOL: Fetch raw data to diagnosis connection issues
export const debugMetaConnection = async (brandId: string) => {
    const token = await getAccessToken(brandId);
    if (!token) return { error: "No token found locally" };

    const debugData: any = { token_preview: token.substring(0, 10) + "..." };

    try {
        // Check Permissions
        const permRes = await fetch(`${GRAPH_API}/me/permissions?access_token=${token}`);
        debugData.permissions = await permRes.json();

        // Check Direct Accounts
        const accRes = await fetch(`${GRAPH_API}/me/adaccounts?fields=name,account_id&access_token=${token}`);
        debugData.direct_accounts = await accRes.json();

        // Check Business Manager
        const bizRes = await fetch(`${GRAPH_API}/me/businesses?fields=id,name,client_ad_accounts{name,account_id},owned_ad_accounts{name,account_id}&access_token=${token}`);
        debugData.businesses = await bizRes.json();
    } catch (e: any) {
        debugData.fetch_error = e.toString();
    }

    return debugData;
};

// --- INSTAGRAM API WRAPPERS (Using Next.js API Routes) ---

export const getInstagramProfile = async (pageId: string, brandId: string) => {
    try {
        const response = await fetch(`/api/instagram/profile?pageId=${pageId}&brandId=${brandId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch Instagram profile');
        }

        return data;
    } catch (error: any) {
        console.error('[getInstagramProfile Error]:', error);
        throw error;
    }
};

export const getInstagramMedia = async (igBusinessAccountId: string, brandId: string, limit: number = 12) => {
    try {
        const response = await fetch(`/api/instagram/media?igBusinessAccountId=${igBusinessAccountId}&brandId=${brandId}&limit=${limit}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch Instagram media');
        }

        return data;
    } catch (error: any) {
        console.error('[getInstagramMedia Error]:', error);
        throw error;
    }
};

export const getFacebookPages = async (brandId: string) => {
    try {
        const response = await fetch(`/api/facebook/pages?brandId=${brandId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch Facebook Pages');
        }

        return data;
    } catch (error: any) {
        console.error('[getFacebookPages Error]:', error);
        throw error;
    }
};

export const getFacebookProfile = async (pageId: string, brandId: string) => {
    try {
        const response = await fetch(`/api/facebook/profile?pageId=${pageId}&brandId=${brandId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch Facebook profile');
        }

        return data;
    } catch (error: any) {
        console.error('[getFacebookProfile Error]:', error);
        throw error;
    }
};

export const getFacebookFeed = async (pageId: string, brandId: string, limit: number = 10) => {
    try {
        const response = await fetch(`/api/facebook/feed?pageId=${pageId}&brandId=${brandId}&limit=${limit}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch Facebook feed');
        }

        return data;
    } catch (error: any) {
        console.error('[getFacebookFeed Error]:', error);
        throw error;
    }
};
