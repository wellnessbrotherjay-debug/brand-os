import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

function guessEquipment(name) {
  const n = name.toLowerCase();
  if (n.includes('dumbbell') || n.includes('db')) return 'Dumbbells';
  if (n.includes('kettlebell') || n.includes('kb')) return 'Kettlebell';
  if (n.includes('barbell') || n.includes('bb')) return 'Barbell';
  if (n.includes('band')) return 'Band';
  if (n.includes('box')) return 'Box';
  if (n.includes('bosu')) return 'BOSU';
  if (n.includes('trx')) return 'TRX';
  if (n.includes('treadmill')) return 'Treadmill';
  if (n.includes('bike')) return 'Bike';
  if (n.includes('bench')) return 'Bench';
  if (n.includes('med ball') || n.includes('medicine ball')) return 'Medicine Ball';
  return 'Bodyweight'; // Default to bodyweight
}

async function importAllVideos() {
  console.log('--- Starting Global Cloudflare Import ---');

  const videoListPath = path.resolve(__dirname, 'cloudflare_videos.json');
  if (!fs.existsSync(videoListPath)) {
    console.error('scripts/cloudflare_videos.json not found.');
    return;
  }

  const videoList = JSON.parse(fs.readFileSync(videoListPath, 'utf-8'));
  console.log(`Loaded ${videoList.length} videos from Cloudflare.`);

  // 1. Fetch existing mapped video URLs
  const { data: existing, error: fetchError } = await supabase
    .from('exercise_library')
    .select('video_url, exercise_name, slug');

  if (fetchError) {
    console.error('Failed to fetch existing exercises:', fetchError.message);
    return;
  }

  const mappedIds = new Set(existing.map(e => e.video_url).filter(Boolean));
  const mappedSlugs = new Set(existing.map(e => e.slug).filter(Boolean));
  console.log(`Currently mapped videos: ${mappedIds.size}`);

  const unmapped = videoList.filter(v => !mappedIds.has(v.id));
  console.log(`Found ${unmapped.length} unmapped videos.`);

  let successCount = 0;
  for (const video of unmapped) {
    const rawName = video.name || video.filename || 'Unknown Exercise';
    // Clean up name (remove extension, replace hyphens/underscores with spaces)
    let displayName = rawName.split('.')[0].replace(/[-_]/g, ' ');
    // Title Case
    displayName = displayName.replace(/\b\w/g, l => l.toUpperCase());

    const slug = slugify(displayName);
    
    // Avoid slug collisions if we can
    if (mappedSlugs.has(slug)) {
      console.log(`Skipping duplicate slug: ${slug} (${displayName})`);
      continue;
    }

    const equipment = guessEquipment(displayName);

    const payload = {
      exercise_name: displayName,
      slug: slug,
      video_url: video.id,
      required_equipment: equipment,
      instructions: `Perform ${displayName} with proper form.`,
      metadata: {
        imported: true,
        source: 'cloudflare_import',
        original_name: rawName
      }
    };

    const { error } = await supabase
      .from('exercise_library')
      .insert(payload);

    if (error) {
      console.error(`Failed to import ${displayName}:`, error.message);
    } else {
      successCount++;
      mappedSlugs.add(slug);
    }
  }

  console.log(`--- Import Complete ---`);
  console.log(`Successfully imported ${successCount} new exercises.`);
}

importAllVideos();
