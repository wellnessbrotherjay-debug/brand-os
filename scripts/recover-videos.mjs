import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function recover() {
  console.log('--- Starting Video Link Recovery ---');

  // 1. Load Cloudflare metadata
  const cloudflareVideos = JSON.parse(fs.readFileSync('scripts/cloudflare_videos.json', 'utf8'));
  
  // Group working videos by name (normalized)
  const workingNameMap = new Map();
  cloudflareVideos.forEach(v => {
    if (v.duration > 0) {
      const normalized = v.name.toLowerCase().trim();
      if (!workingNameMap.has(normalized)) {
        workingNameMap.set(normalized, v.id);
      }
    }
  });

  console.log(`Found ${workingNameMap.size} unique working video names in Cloudflare.`);

  // 2. Fetch broken exercises from Supabase (those with broken links identified in audit)
  // For simplicity, we'll fetch all and check duration on the fly or use the audit report
  // Let's use the audit report if it exists
  const auditReport = JSON.parse(fs.readFileSync('scripts/audit_report.json', 'utf8'));
  const brokenOnes = auditReport.invalidDuration;

  console.log(`Attempting to recover ${brokenOnes.length} broken exercises...`);

  let recoveredCount = 0;
  for (const ex of brokenOnes) {
    // Try to find a working replacement by name
    // The exercise name in DB might match the CF name or filename
    const searchNames = [
        ex.exercise_name.toLowerCase().trim(),
        ex.exercise_name.toLowerCase().trim() + '.mp4',
        ex.exercise_name.toLowerCase().trim() + '.mov',
        ex.cfData.name.toLowerCase().trim(),
        ex.cfData.filename?.toLowerCase().trim()
    ].filter(Boolean);

    let replacementId = null;
    for (const name of searchNames) {
        if (workingNameMap.has(name)) {
            replacementId = workingNameMap.get(name);
            break;
        }
    }

    if (replacementId) {
      console.log(`Recovering: "${ex.exercise_name}" -> ${replacementId}`);
      const { error } = await supabase
        .from('exercise_library')
        .update({ video_url: replacementId })
        .eq('exercise_name', ex.exercise_name);

      if (error) {
        console.error(`Failed to update ${ex.exercise_name}:`, error.message);
      } else {
        recoveredCount++;
      }
    }
  }

  console.log(`\n--- Recovery Complete ---`);
  console.log(`Total Recovered: ${recoveredCount} / ${brokenOnes.length}`);
}

recover();
