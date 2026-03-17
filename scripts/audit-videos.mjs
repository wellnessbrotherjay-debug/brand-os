import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function audit() {
  console.log('--- Starting Exercise Library Video Audit ---');

  // 1. Load Cloudflare metadata
  let cloudflareVideos = [];
  try {
    const rawData = fs.readFileSync('scripts/cloudflare_videos.json', 'utf8');
    cloudflareVideos = JSON.parse(rawData);
    console.log(`Loaded ${cloudflareVideos.length} videos from Cloudflare metadata.`);
  } catch (err) {
    console.error('Failed to load scripts/cloudflare_videos.json:', err.message);
    process.exit(1);
  }

  const cloudflareIdMap = new Map();
  cloudflareVideos.forEach(v => cloudflareIdMap.set(v.id, v));

  // 2. Fetch all exercises from Supabase
  const { data: exercises, error } = await supabase
    .from('exercise_library')
    .select('exercise_name, video_url, required_equipment');

  if (error) {
    console.error('Failed to fetch exercises:', error.message);
    process.exit(1);
  }

  console.log(`Auditing ${exercises.length} exercises from database...`);

  const results = {
    valid: [],
    missingLink: [], // video_url is null or empty
    brokenLink: [],  // video_url exists but not in Cloudflare map
    invalidDuration: [], // exists but duration <= 0
  };

  exercises.forEach(ex => {
    const url = ex.video_url?.trim();
    if (!url) {
      results.missingLink.push(ex);
      return;
    }

    // Handle potential full URLs by extracting ID
    let id = url;
    if (url.includes('customer-') && url.includes('.cloudflarestream.com/')) {
        id = url.split('.cloudflarestream.com/')[1].split('/')[0];
    } else if (url.startsWith('http')) {
        // Generic URL, maybe not Cloudflare?
    }

    const cfVideo = cloudflareIdMap.get(id);

    if (!cfVideo) {
      results.brokenLink.push({ ...ex, idUsed: id });
    } else if (cfVideo.duration <= 0) {
      results.invalidDuration.push({ ...ex, idUsed: id, cfData: cfVideo });
    } else {
      results.valid.push({ ...ex, cfData: cfVideo });
    }
  });

  console.log('\n--- Audit Results ---');
  console.log(`✅ Fully Working Links: ${results.valid.length}`);
  console.log(`⚠️ Missing Links: ${results.missingLink.length}`);
  console.log(`❌ Broken Links (ID not found in CF): ${results.brokenLink.length}`);
  console.log(`🚫 Processing Errors (Duration <= 0): ${results.invalidDuration.length}`);

  if (results.brokenLink.length > 0 || results.invalidDuration.length > 0) {
    const allErrors = [...results.brokenLink, ...results.invalidDuration];
    console.log(`\nTop 20 Exercises with Errors:`);
    allErrors.slice(0, 20).forEach(ex => {
      const reason = results.brokenLink.includes(ex) ? 'ID not found' : 'Invalid Duration';
      console.log(`- ${ex.exercise_name} (${reason})`);
    });
    
    // Write detailed report to a file
    const reportPath = 'scripts/audit_report.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\nDetailed report written to: ${reportPath}`);
  }

  console.log('\n--- Audit Complete ---');
}

audit();
