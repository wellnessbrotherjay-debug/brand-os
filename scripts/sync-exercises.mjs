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
  console.error('Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function sync() {
  console.log('--- Starting Video Sync ---');

  // 1. Read Cloudflare video mappings
  const videoListPath = path.resolve(__dirname, 'cloudflare_videos.json');
  if (!fs.existsSync(videoListPath)) {
    console.error('Missing scripts/cloudflare_videos.json');
    process.exit(1);
  }
  const videoList = JSON.parse(fs.readFileSync(videoListPath, 'utf-8'));
  console.log(`Loaded ${videoList.length} videos from Cloudflare list.`);

  // 2. Fetch exercises from Supabase
  const { data: exercises, error: fetchError } = await supabase
    .from('exercise_library')
    .select('id, exercise_name, required_equipment');

  if (fetchError) {
    console.error('Error fetching exercises:', fetchError.message);
    process.exit(1);
  }
  console.log(`Fetched ${exercises.length} exercises from Supabase.`);

  // 3. Map and Update
  let matchedCount = 0;
  let updatedCount = 0;

  for (const exercise of exercises) {
    const exerciseName = exercise.exercise_name.toLowerCase().trim();
    
    // Try to find a matching video
    // Strategies:
    // a. Exact filename match (without extension)
    // b. Exact name match
    // c. Partial match
    
    // Manual mapping for common exercises if auto-matching fails
    const manualMappings = {
      'burpees': '39b64433fd60d29565f1a1a76be0782e', // Box Jump Burpee
      'push ups': 'd5c65024d08f9ce3359b56f849568ca4', // Push-up
      'goblet squats': '8ec9c09a858c3e605da79ff58e7515a3', // squat pulse 
      'plank hold': 'ee4039cfa2bf54555754d2890670d16c', // Box plank
      'mountain climbers': 'd1dc6d11e06382c905e50b3959abcb35', // TRX mountain climbers
      'dumbbell thrusters': '5cfa6aecc8089781efd94c56d2beb5ab', // Barbell Front Squat Back Lunge (closest cardio-ish)
    };

    let matchedVideo = videoList.find(v => {
      const vName = (v.name || '').toLowerCase().trim();
      const vFileName = (v.filename || '').toLowerCase().trim();
      const vBaseName = vFileName.split('.')[0];
      
      // Helper to normalize and compare
      const normalize = (s) => s.replace(/[^a-z0-9]/g, '');
      const normExercise = normalize(exerciseName);
      const normVName = normalize(vName);
      const normVFile = normalize(vFileName);
      const normVBase = normalize(vBaseName);

      return vName === exerciseName || 
             vFileName === exerciseName || 
             vBaseName === exerciseName ||
             normExercise === normVName ||
             normExercise === normVFile ||
             normExercise === normVBase ||
             vName.includes(exerciseName) ||
             exerciseName.includes(vName);
    });

    let videoUrl = matchedVideo ? matchedVideo.id : manualMappings[exerciseName];
    
    // Determine equipment if missing
    let targetEquipment = exercise.required_equipment;
    if (!targetEquipment) {
      if (['burpees', 'push ups', 'plank hold', 'mountain climbers'].includes(exerciseName)) {
        targetEquipment = 'bodyweight';
      } else if (['goblet squats', 'dumbbell thrusters'].includes(exerciseName)) {
        targetEquipment = 'dumbbells';
      }
    }

    if (videoUrl || targetEquipment) {
      matchedCount++;
      
      const updatePayload = {};
      if (videoUrl) updatePayload.video_url = videoUrl;
      if (targetEquipment) updatePayload.required_equipment = targetEquipment;

      const { error: updateError } = await supabase
        .from('exercise_library')
        .update(updatePayload)
        .eq('id', exercise.id);

      if (updateError) {
        console.error(`Failed to update ${exercise.exercise_name}:`, updateError.message);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`--- Sync Complete ---`);
  console.log(`Matched: ${matchedCount}`);
  console.log(`Successfully Updated: ${updatedCount}`);
  console.log(`Missed: ${exercises.length - matchedCount}`);
}

sync();
