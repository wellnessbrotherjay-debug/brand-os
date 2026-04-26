import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixVideos() {
  const jsonPath = path.join(__dirname, "cloudflare_videos.json");
  const videoList = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`Loaded ${videoList.length} Cloudflare videos.`);

  const { data: exercises, error } = await supabase.from("exercises").select("*");
  if (error || !exercises) {
    console.error("DB error", error);
    return;
  }
  console.log(`Checking ${exercises.length} exercises from Supabase.`);

  let fixCount = 0;
  let nulledCount = 0;

  for (const ex of exercises) {
    const isId = /^[a-f0-9]{32}$/i.test(ex.demo_url || "");
    const isCfUrl = (ex.demo_url || "").includes("cloudflare") || (ex.demo_url || "").includes("videodelivery");
    
    // If it's already a valid lookin Cloudflare ID/URL, we trust it.
    if (isId || isCfUrl) continue;

    // Otherwise, we try to match from our Cloudflare DB
    const lowerName = ex.name.toLowerCase().trim();
    const normalize = (s: string) => s.replace(/[^a-z0-9]/g, '');
    const normName = normalize(lowerName);

    const match = videoList.find((v: any) => {
      const vName = (v.name || "").toLowerCase().trim();
      const vFileName = (v.filename || "").toLowerCase().trim();
      const vBaseName = vFileName.split(".")[0];
      
      return vName === lowerName || 
             vFileName === lowerName || 
             vBaseName === lowerName ||
             normalize(vName) === normName ||
             normalize(vFileName) === normName ||
             vName.includes(lowerName) ||
             lowerName.includes(vName);
    });

    if (match) {
      console.log(`✅ MATCH: "${ex.name}" matched to Cloudflare "${match.name}" (ID: ${match.id})`);
      await supabase.from("exercises").update({ demo_url: match.id }).eq("id", ex.id);
      fixCount++;
    } else {
      // CLEAR out non-working links as per GOD rule
      if (ex.demo_url) {
        console.log(`❌ NO MATCH: "${ex.name}" (Current URL: ${ex.demo_url}) -> Clearing.`);
        await supabase.from("exercises").update({ demo_url: null }).eq("id", ex.id);
        nulledCount++;
      }
    }
  }

  console.log(`--- Sync Complete ---`);
  console.log(`Matched & Fixed: ${fixCount}`);
  console.log(`Cleared (Broken): ${nulledCount}`);
}

fixVideos();
