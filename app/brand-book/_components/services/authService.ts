
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

// Load env vars
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const FB_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- FACEBOOK / INSTAGRAM AUTH (REDIRECT FLOW) ---

// GUARD: Check if App ID is valid
// We check for falsy values AND string representations of "undefined"/"null" which can happen in some build setups.
if (!FB_APP_ID || FB_APP_ID === 'placeholder' || FB_APP_ID === 'undefined' || FB_APP_ID === 'null' || FB_APP_ID.trim() === '') {
    const msg = `[AuthService] CRITICAL CONFIG ERROR: Facebook App ID is invalid. Value: '${FB_APP_ID}'`;
    console.error(msg);
    alert(`Configuration Error: Meta App ID is missing or invalid. (Value: ${FB_APP_ID}).\nPlease check NEXT_PUBLIC_FACEBOOK_APP_ID in .env.local`);
    return null;
}

console.log("[AuthService] Redirecting to Meta with App ID:", FB_APP_ID);

// SDK is blocking HTTP localhost, so we use manual redirect flow.
// This is more robust for dev environments.
const redirectUri = window.location.origin + '/brand-book'; // Redirect back to Brand Book
const scope = 'ads_management,ads_read,business_management,pages_read_engagement,instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,pages_show_list,public_profile';

// Construct OAuth URL
const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}`;

console.log("[AuthService] Final Auth URL:", authUrl);

// Redirect
window.location.href = authUrl;

// Return null because we are leaving the page
return null;
};

// New helper to parse hash after redirect AND save to DB
export const checkUrlForToken = async (brandId: string) => {
    if (typeof window === 'undefined') return null;

    const hash = window.location.hash;
    // Handle both hash (#) and search (?) styles just in case
    if (hash && hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.replace('#', ''));
        const accessToken = params.get('access_token');
        const expiresIn = params.get('expires_in');

        if (accessToken) {
            try {
                // 1. Fetch FB User ID
                const meRes = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}`);
                const meData = await meRes.json();
                const userID = meData.id || 'unknown';

                // 2. Fetch Pages to see if there's an IG Business account
                const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=name,instagram_business_account&access_token=${accessToken}`);
                const pagesData = await pagesRes.json();

                // Store page info in tokens if found
                const pages = pagesData.data || [];
                const firstIgAccount = pages.find((p: any) => p.instagram_business_account)?.instagram_business_account?.id;

                const tokenData = {
                    accessToken,
                    expiresIn: expiresIn ? parseInt(expiresIn) : 5184000, // 60 days
                    userID,
                    igAccountId: firstIgAccount || null,
                    pages: pages.map((p: any) => ({ id: p.id, name: p.name, hasIg: !!p.instagram_business_account }))
                };

                console.log("[AuthService] Saving token for brand:", brandId, "IG Account:", firstIgAccount);
                await saveSocialToken(brandId, 'facebook', tokenData);

                return tokenData;
            } catch (e) {
                console.error("Failed to fetch social details", e);
            }
        }
    }
    return null;
};

// --- GOOGLE DRIVE AUTH (Simplistic Implicit Flow or GIS) ---
// For a quick fix, we can use the GIS library
export const loginWithGoogle = async () => {
    // This requires loading https://accounts.google.com/gsi/client
    // Implementing a basic redirect flow or popup here is complex without the script.
    // For now, let's focus on Meta as the user complained about "Meta sync".
    // We will confirm Meta mostly first.
    return null;
};


// --- SAVE TOKENS TO SUPABASE ---

// --- SAVE TOKENS TO SUPABASE (WITH LOCALSTORAGE FALLBACK) ---

export const saveSocialToken = async (brandId: string, platform: 'facebook' | 'google' | 'instagram', tokenData: any) => {
    // GUARD: Ensure we have a valid token before doing anything
    if (!tokenData?.accessToken || tokenData.accessToken === 'undefined' || tokenData.accessToken === 'null') {
        console.error("[AuthService] Attempted to save invalid token:", tokenData);
        return;
    }

    try {
        // STRATEGY: "Nuke and Pave" to guarantee no duplicates and solve PGRST116 errors forever.

        // 1. Delete ANY existing rows for this brand/platform
        const { error: deleteError } = await supabase
            .from('social_integrations')
            .delete()
            .eq('brand_id', brandId)
            .eq('platform', platform);

        if (deleteError) {
            console.warn("[AuthService] Delete failed (non-fatal):", deleteError);
        }

        // 2. Insert fresh row
        const { error: insertError } = await supabase
            .from('social_integrations')
            .insert({
                brand_id: brandId,
                platform: platform,
                access_token: tokenData.accessToken,
                token_expires_at: new Date(Date.now() + (tokenData.expiresIn * 1000)).toISOString(),
                platform_user_id: tokenData.userID
            } as any);

        if (insertError) throw insertError;

        console.log("[AuthService] Token saved successfully to DB.");

    } catch (e) {
        console.error("[AuthService] DB Save Failed. Falling back to LocalStorage.", e);
        // FALLBACK: Save to LocalStorage so app still works locally
        if (typeof window !== 'undefined') {
            localStorage.setItem(`exequte_${platform}_token_${brandId}`, tokenData.accessToken);
            // alert("Connected to Facebook! (Saved locally due to database connection issue)");
        }
    }
};

export const deleteSocialToken = async (brandId: string, platform: 'facebook' | 'google' | 'instagram') => {
    // 1. Try to remove from DB
    try {
        await supabase
            .from('social_integrations')
            .delete()
            .eq('brand_id', brandId)
            .eq('platform', platform);
    } catch (e) {
        console.warn("Failed to delete from DB", e);
    }

    // 2. Always remove from LocalStorage
    if (typeof window !== 'undefined') {
        localStorage.removeItem(`exequte_${platform}_token_${brandId}`);
        console.log(`[AuthService] Removed local token for ${platform}`);
    }
};
