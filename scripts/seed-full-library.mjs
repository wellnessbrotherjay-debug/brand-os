import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

async function seed() {
  console.log('--- Starting Full Library Seeding ---');

  // 1. Read Cloudflare video mappings
  const videoListPath = path.resolve(__dirname, 'cloudflare_videos.json');
  const videoList = JSON.parse(fs.readFileSync(videoListPath, 'utf-8'));
  console.log(`Loaded ${videoList.length} videos from Cloudflare.`);

  // 2. Read Default Exercises from file (since importing TS might be tricky in pure MJS)
  const libPath = path.resolve(__dirname, '../lib/lib/exercise-library.ts');
  const libContent = fs.readFileSync(libPath, 'utf-8');
  
  // Basic extraction logic for the array
  // We'll look for the content between DEFAULT_EXERCISE_MEDIA = [ and ];
  const startIdx = libContent.indexOf('DEFAULT_EXERCISE_MEDIA: ExerciseMedia[] = [');
  const endIdx = libContent.lastIndexOf('];');
  
  if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find DEFAULT_EXERCISE_MEDIA in exercise-library.ts');
    process.exit(1);
  }

  // This is a bit brittle, but since we control the file, we can make it work.
  // We'll use a more robust way: eval the content in a sandbox or just use regex to extract objects.
  // Actually, since I can't easily eval TS, I'll use a regex to find all exercise blocks.
  
  const exerciseRegex = /\{[\s\S]*?name:\s*"([^"]+)",[\s\S]*?equipment:\s*"([^"]+)",[\s\S]*?video:\s*"([^"]+)"(?:,[\s\S]*?muscles:\s*(\[[^\]]*\]))?(?:,[\s\S]*?cues:\s*(\[[^\]]*\]))?[\s\S]*?\}/g;
  
  let match;
  const exercises = [];
  while ((match = exerciseRegex.exec(libContent)) !== null) {
    exercises.push({
      name: match[1],
      equipment: match[2],
      video: match[3],
      muscles: match[4] ? JSON.parse(match[4].replace(/'/g, '"')) : [],
      cues: match[5] ? JSON.parse(match[5].replace(/'/g, '"')) : []
    });
  }

  console.log(`Extracted ${exercises.length} exercises from codebase.`);

  // 3. Fetch existing exercises to avoid duplicates when venue_id is null
  const { data: existingExercises } = await supabase
    .from('exercise_library')
    .select('id, slug, exercise_name');

  const existingBySlug = new Map(existingExercises.map(ex => [ex.slug, ex.id]));
  const existingByName = new Map(existingExercises.map(ex => [ex.exercise_name.toLowerCase(), ex.id]));

  // 4. Match and Upsert
  let successCount = 0;
  for (const ex of exercises) {
    const slug = slugify(ex.name);
    
    // Find matching video in Cloudflare list
    const exerciseName = ex.name.toLowerCase().trim();
    const matchedVideo = videoList.find(v => {
      const vName = (v.name || '').toLowerCase().trim();
      const vFileName = (v.filename || '').toLowerCase().trim();
      const vBaseName = vFileName.split('.')[0];
      return vName === exerciseName || vFileName === exerciseName || vBaseName === exerciseName;
    });

    const videoUrl = matchedVideo ? matchedVideo.id : ex.video;

    const payload = {
      slug,
      exercise_name: ex.name,
      required_equipment: ex.equipment,
      video_url: videoUrl,
      equipment_tags: [ex.equipment],
      muscle_tags: ex.muscles || [],
      metadata: {
        muscles: ex.muscles,
        cues: ex.cues,
        equipment: ex.equipment
      },
      instructions: ex.cues.join('\n')
    };

    // Check if we already have this exercise
    const existingId = existingBySlug.get(slug) || existingByName.get(exerciseName);

    let result;
    if (existingId) {
      result = await supabase
        .from('exercise_library')
        .update(payload)
        .eq('id', existingId);
    } else {
      result = await supabase
        .from('exercise_library')
        .insert(payload);
    }

    if (result.error) {
      console.error(`Failed to handle ${ex.name}:`, result.error.message);
    } else {
      successCount++;
    }
  }

  console.log(`--- Seeding Complete ---`);
  console.log(`Successfully seeded ${successCount} exercises.`);
}

seed();
