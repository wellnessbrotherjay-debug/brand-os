
const CLOUDFLARE_ACCOUNT_ID = 'f53c738a89d6b47861c6f339e9d64ae5';
const CLOUDFLARE_API_TOKEN = 'k7vsaed9qcYeCbQUGO5urQzFmPRs6e_dPH8OkTLs';
import fs from 'fs';

async function fetchAllVideos() {
    console.log('Fetching videos from Cloudflare Stream API...');
    let allVideos = [];
    let url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Cloudflare API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    if (data.result) {
        allVideos.push(...data.result);
    }

    const summary = allVideos.map(v => ({
        id: v.uid,
        name: v.meta?.name || v.meta?.filename || 'Untitled',
        filename: v.meta?.filename,
        duration: v.duration,
        preview: v.preview
    }));

    fs.writeFileSync('scripts/cloudflare_videos.json', JSON.stringify(summary, null, 2));
    console.log(`Saved ${summary.length} videos to scripts/cloudflare_videos.json`);
}

fetchAllVideos().catch(console.error);
