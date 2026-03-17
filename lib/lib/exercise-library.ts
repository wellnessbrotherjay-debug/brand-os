export type ExerciseMedia = {
  name: string;
  equipment: string;
  video: string;
  muscles?: string[];
  cues?: string[];
};

const PUBLIC_VIDEO_BASE = "/videos/public";

const buildVideoPath = (filename: string) => {
  if (filename.endsWith('.MP4')) {
    return resolveVideoUrl("5f547fa37147777b16708dfe1f9f71cc");
  }
  return `${PUBLIC_VIDEO_BASE}/${encodeURIComponent(filename)}`;
};

export function resolveVideoUrl(idOrUrl: string): string {
  if (!idOrUrl) return "";
  if (idOrUrl.startsWith("http")) return idOrUrl;
  // Append min_bitrate to encourage high quality on iPad/Safari
  return `https://customer-625e9kfx1zh9uf3o.cloudflarestream.com/${idOrUrl}/manifest/video.m3u8?min_bitrate=1.5Mbps`;
}

export const DEFAULT_EXERCISE_MEDIA: ExerciseMedia[] = [
  // Dumbbells
  {
    name: "Alt Hammer Curls",
    equipment: "dumbbells",
    video: "6384f51bc1425d5e98f1862776ffd019",
    muscles: ["biceps", "forearms"],
    cues: ["Keep elbows pinned", "Control the lowering phase"],
  },
  {
    name: "Renegade Row",
    equipment: "dumbbells",
    video: "a336b2b1c4814814b94b438fa13e6fbb",
    muscles: ["back", "core", "arms"],
    cues: ["Hold a plank", "Pull elbow to the sky"],
  },
  {
    name: "DB Squat Woodchops",
    equipment: "dumbbells",
    video: "91eb219ccc758944dfd59e0c65491a91",
    muscles: ["legs", "core"],
    cues: ["Sit into the squat", "Drive the weight overhead in one motion"],
  },
  {
    name: "DB Tricep Kickback",
    equipment: "dumbbells",
    video: "e944b2545ef05c042fed961f1498a42a",
    muscles: ["triceps"],
    cues: ["Lock the elbow in place", "Squeeze at the top"],
  },

  // Barbell
  {
    name: "Barbell Shoulder Press",
    equipment: "barbell",
    video: "e4a8b6ee6e5635d821907609ffab967e",
    muscles: ["shoulders", "triceps"],
    cues: ["Brace your core", "Press straight overhead"],
  },
  {
    name: "Barbell Sit Up",
    equipment: "barbell",
    video: "4859c67dc4710fb03a1af2edbcb9cc19",
    muscles: ["core", "hip flexors"],
    cues: ["Keep the bar stacked", "Control the descent"],
  },
  {
    name: "Barbell Front Squat Back Lunge",
    equipment: "barbell",
    video: "5cfa6aecc8089781efd94c56d2beb5ab",
    muscles: ["quads", "glutes"],
    cues: ["Elbows high", "Push through the front heel"],
  },

  // Bands / bench
  {
    name: "Band Bench Press",
    equipment: "bench",
    video: "6c4c5fe9804e87cc679b8eab1780e92d",
    muscles: ["chest", "triceps"],
    cues: ["Drive shoulders into the pad", "Press evenly with both hands"],
  },
  {
    name: "Band Single Arm Tricep Extension",
    equipment: "band",
    video: "74c586d0d31aa4416513e2754a1974e9",
    muscles: ["triceps"],
    cues: ["Lock elbows", "Squeeze the finish"],
  },
  {
    name: "Band Seated Lat Pull Down",
    equipment: "band",
    video: "1fe74d766ddeb0d3ea20567a9cb6774c",
    muscles: ["back", "lats"],
    cues: ["Drive elbows toward ribs", "Keep chest proud"],
  },
  {
    name: "Walking Lunge",
    equipment: "dumbbells",
    video: "f4f49cbf22096fe7a337465bee6c0c01",
    muscles: ["glutes", "quads"],
    cues: ["Step long", "Push through the front heel"],
  },

  // Bodyweight
  {
    name: "Push-Up",
    equipment: "bodyweight",
    video: "d5c65024d08f9ce3359b56f849568ca4",
    muscles: ["chest", "shoulders", "triceps"],
    cues: ["Maintain a plank line", "Tap softly without rotating"],
  },
  {
    name: "Slow Wide Arm Push Up",
    equipment: "bodyweight",
    video: "393538925c722b05c985795885f83b1b",
    muscles: ["chest", "shoulders"],
    cues: ["Lower with control", "Keep elbows slightly bent at top"],
  },

  // TRX
  {
    name: "TRX Row",
    equipment: "trx",
    video: "aa7dfaf3372a957d77648fba6ff62134",
    muscles: ["back", "biceps"],
    cues: ["Squeeze shoulder blades", "Keep body straight"],
  },
  {
    name: "TRX Pike",
    equipment: "trx",
    video: "f01b3c34e40bcb2d43593c2444890d2f",
    muscles: ["core", "shoulders"],
    cues: ["Lift hips to the sky", "Keep legs straight"],
  },

  // BOSU
  {
    name: "BOSU Side Plank Hip Drops",
    equipment: "bosu",
    video: "359dd10e2c026f1ace1b51e7f78241d3",
    muscles: ["core", "obliques"],
    cues: ["Press the forearm into the BOSU", "Drive hips high"],
  },
  {
    name: "BOSU Knee Tuck",
    equipment: "bosu",
    video: "d29d7ae710d301c53fd73d409bfdcf92",
    muscles: ["core", "hip flexors"],
    cues: ["Keep shoulders stacked above hands", "Pull knees in tight"],
  },
  {
    name: "Bosu Russian Twists",
    equipment: "bosu",
    video: "409b08eb19cfe8f5e14dea393300ea6e",
    muscles: ["core", "obliques"],
    cues: ["Stay tall through the chest", "Rotate from the ribs"],
  },

  // Box / Plyo
  {
    name: "Box Step Up",
    equipment: "box",
    video: "344daa5da4c57504bda42a7a054ebda2",
    muscles: ["legs", "glutes"],
    cues: ["Plant the full foot", "Drive through the heel"],
  },
  {
    name: "Box Jump Burpee",
    equipment: "box",
    video: "39b64433fd60d29565f1a1a76be0782e",
    muscles: ["total body"],
    cues: ["Land softly on the box", "Keep chest lifted from the burpee"],
  },

  // Bench variations
  {
    name: "Incline Press",
    equipment: "bench",
    video: "1ddc9bf1c89b660004b7a6253f28bf89",
    muscles: ["chest", "shoulders"],
    cues: ["Lower to the box with control", "Drive through the floor"],
  },
  {
    name: "Bench Press Hold",
    equipment: "bench",
    video: "b9659815ec7e2634ee92b88f23d54504",
    muscles: ["chest", "triceps"],
    cues: ["Pin shoulder blades down", "Pause with elbows at 90°"],
  },

  // Cardio placeholders (mapped to SkiErg clips for now)
  {
    name: "Treadmill Run",
    equipment: "treadmill",
    video: "8369c9ff648b505228ae987fcdddb730",
    muscles: ["cardio", "full body"],
    cues: ["Stay tall", "Drive elbows back"],
  },
  {
    name: "Bike Sprint",
    equipment: "bike",
    video: "40d007c2241fcaae14b47a1c6cabd20c",
    muscles: ["cardio", "upper body"],
    cues: ["Push/pull evenly", "Keep cadence high"],
  },
  {
    name: "Reverse grip Deadlift into row",
    equipment: "barbell",
    video: "6586fd790fec609fb2277c33258e3e9b",
    muscles: ["back", "hamstrings", "glutes"],
    cues: ["Keep back flat", "Pull barbell to belly button", "Reverse grip (palms up)"],
  },
];

export const EXERCISE_MEDIA = DEFAULT_EXERCISE_MEDIA;
export const FALLBACK_EXERCISE_VIDEO =
  resolveVideoUrl("cea8e05486e40fd74f7f1d5574d37c7b");

export function getMediaForExercise(exerciseName: string): ExerciseMedia | null {
  return DEFAULT_EXERCISE_MEDIA.find(
    (item) => item.name.trim().toLowerCase() === exerciseName.trim().toLowerCase()
  ) || null;
}
