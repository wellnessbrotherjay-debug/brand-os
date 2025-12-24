
import { SocialJob, ContentPost, Brand, AssetStatus, BrandAsset } from '../types';
import { generateCreativeCopy } from './geminiService';

// --- MOCK BACKEND ENGINE ---
// This file simulates the behavior of a backend automation system (like n8n)
// It handles job creation, asset processing, and mock API calls.

export const createSocialJob = async (
    brand: Brand, 
    brief: string, 
    channels: string[]
): Promise<SocialJob> => {
    // 1. Create Job Container
    const jobId = crypto.randomUUID();
    const job: SocialJob = {
        id: jobId,
        brand_id: brand.id,
        title: brief.split('.')[0] || 'New Campaign',
        brief,
        status: 'copywriting',
        channels: channels as any,
        posts: [],
        due_date: new Date().toISOString() // Mock default due date
    };

    // 2. Generate Copy for Channels (Simulated AI Step)
    const newPosts: ContentPost[] = [];
    
    // We use a simple loop here, but in a real backend this would be a queue
    for (const channel of channels) {
        const copy = await generateCreativeCopy(brand, channel, 'Post', {
            objective: 'Engagement',
            target_audience: 'Followers',
            key_message: brief,
            visual_tone: 'On Brand'
        });

        newPosts.push({
            id: crypto.randomUUID(),
            brand_id: brand.id,
            job_id: jobId,
            platform: channel,
            title: `${channel} Post for ${job.title}`,
            caption: copy,
            media_urls: [],
            status: 'pending_design', // Move to design stage
            scheduled_for: new Date().toISOString(),
            metrics_views: 0,
            metrics_likes: 0,
            metrics_comments: 0,
            metrics_saves: 0,
            metrics_shares: 0
        });
    }

    job.posts = newPosts;
    return job;
};

export const uploadAssetForPost = (
    brandId: string, 
    postId: string, 
    file: File, 
    fileUrl: string
): BrandAsset => {
    // Simulate Drive Sync & Asset Record Creation
    return {
        id: crypto.randomUUID(),
        brand_id: brandId,
        asset_type: 'image', // simplified
        title: file.name,
        description: `Generated for Post ${postId}`,
        file_url: fileUrl,
        tags: ['social', 'campaign'],
        status: 'Draft',
        feedback_comments: []
    };
};

export const publishJob = async (job: SocialJob): Promise<{success: boolean}> => {
    // Simulate API calls to Instagram, Facebook, etc.
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true });
        }, 2000);
    });
};
