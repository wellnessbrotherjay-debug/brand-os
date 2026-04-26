import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate_batch() {
  console.log("--- Starting Batch Migration to exercises table ---");

  const { data: libItems, error: libError } = await supabase.from("exercise_library").select("*");
  if (libError || !libItems) {
    console.error("Lib fetch error", libError);
    return;
  }
  console.log(`Found ${libItems.length} items in exercise_library.`);

  const validItems = libItems.filter(item => item.video_url && item.video_url.trim() !== "");
  console.log(`${validItems.length} have working video IDs.`);

  const batchSize = 50;
  let successCount = 0;

  for (let i = 0; i < validItems.length; i += batchSize) {
    const batch = validItems.slice(i, i + batchSize).map(item => ({
      name: item.exercise_name,
      slug: (item.exercise_name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"),
      demo_url: item.video_url,
      equipment: (item.required_equipment || "bodyweight").toLowerCase(),
      type: "strength",
      tags: item.target_muscles || []
    }));

    const { error: upsertError } = await supabase.from("exercises").upsert(batch, { onConflict: "slug" });
    
    if (upsertError) {
      console.error(`Error in batch ${i}:`, upsertError.message);
    } else {
      successCount += batch.length;
      console.log(`✅ Upserted batch starting at ${i} (${batch.length} items)`);
    }
  }

  console.log(`--- Migration Complete ---`);
  console.log(`Successfully Synchronized ${successCount} exercises.`);
}

migrate_batch();
