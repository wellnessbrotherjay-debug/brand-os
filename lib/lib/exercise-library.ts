export type ExerciseMedia = {
  name: string;
  equipment: string;
  video: string;
  muscles?: string[];
  cues?: string[];
};

const PUBLIC_VIDEO_BASE = "/videos/public";

const buildVideoPath = (filename: string) =>
  `${PUBLIC_VIDEO_BASE}/${encodeURIComponent(filename)}`;

export const DEFAULT_EXERCISE_MEDIA: ExerciseMedia[] = [
  // Dumbbells
  {
    name: "Alt Hammer Curls",
    equipment: "dumbbells",
    video: buildVideoPath("Alt hammer curls .MP4"),
    muscles: ["biceps", "forearms"],
    cues: ["Keep elbows pinned", "Control the lowering phase"],
  },
  {
    name: "Renegade Row",
    equipment: "dumbbells",
    video: buildVideoPath("Renegade row.MP4"),
    muscles: ["back", "core", "arms"],
    cues: ["Hold a plank", "Pull elbow to the sky"],
  },
  {
    name: "DB Squat Woodchops",
    equipment: "dumbbells",
    video: buildVideoPath("DB squat woodchops .MP4"),
    muscles: ["legs", "core"],
    cues: ["Sit into the squat", "Drive the weight overhead in one motion"],
  },
  {
    name: "DB Tricep Kickback",
    equipment: "dumbbells",
    video: buildVideoPath("DB tricep kick back.MP4"),
    muscles: ["triceps"],
    cues: ["Lock the elbow in place", "Squeeze at the top"],
  },

  // Barbell
  {
    name: "Barbell Shoulder Press",
    equipment: "barbell",
    video: buildVideoPath("Barbell back squat into press.MP4"),
    muscles: ["shoulders", "triceps"],
    cues: ["Brace your core", "Press straight overhead"],
  },
  {
    name: "Barbell Sit Up",
    equipment: "barbell",
    video: buildVideoPath("BB sit up.MP4"),
    muscles: ["core", "hip flexors"],
    cues: ["Keep the bar stacked", "Control the descent"],
  },
  {
    name: "Barbell Front Squat Back Lunge",
    equipment: "barbell",
    video: buildVideoPath("Barbell front squat back lunge .MP4"),
    muscles: ["quads", "glutes"],
    cues: ["Elbows high", "Push through the front heel"],
  },

  // Bands / bench
  {
    name: "Band Bench Press",
    equipment: "bench",
    video: buildVideoPath("Band bench press .MP4"),
    muscles: ["chest", "triceps"],
    cues: ["Drive shoulders into the pad", "Press evenly with both hands"],
  },
  {
    name: "Band Single Arm Tricep Extension",
    equipment: "band",
    video: buildVideoPath("Band Single arm tricep ext.MP4"),
    muscles: ["triceps"],
    cues: ["Lock elbows", "Squeeze the finish"],
  },
  {
    name: "Band Seated Lat Pull Down",
    equipment: "band",
    video: buildVideoPath("Band seated lat pull down.MP4"),
    muscles: ["back", "lats"],
    cues: ["Drive elbows toward ribs", "Keep chest proud"],
  },
  {
    name: "Walking Lunge",
    equipment: "dumbbells",
    video: buildVideoPath("Band single leg lunge .MP4"),
    muscles: ["glutes", "quads"],
    cues: ["Step long", "Push through the front heel"],
  },

  // Bodyweight
  {
    name: "Push-Up",
    equipment: "bodyweight",
    video: buildVideoPath("Push-up shoulder taps.MP4"),
    muscles: ["chest", "shoulders", "triceps"],
    cues: ["Maintain a plank line", "Tap softly without rotating"],
  },
  {
    name: "Slow Wide Arm Push Up",
    equipment: "bodyweight",
    video: buildVideoPath("Wide arm push-up.MP4"),
    muscles: ["chest", "shoulders"],
    cues: ["Lower with control", "Keep elbows slightly bent at top"],
  },

  // TRX
  {
    name: "TRX Row",
    equipment: "trx",
    video: buildVideoPath("TRX bicep curls.MP4"),
    muscles: ["back", "biceps"],
    cues: ["Squeeze shoulder blades", "Keep body straight"],
  },
  {
    name: "TRX Pike",
    equipment: "trx",
    video: buildVideoPath("TRX pike.MP4"),
    muscles: ["core", "shoulders"],
    cues: ["Lift hips to the sky", "Keep legs straight"],
  },

  // BOSU
  {
    name: "BOSU Side Plank Hip Drops",
    equipment: "bosu",
    video: buildVideoPath("Bosu side plank rotations.MP4"),
    muscles: ["core", "obliques"],
    cues: ["Press the forearm into the BOSU", "Drive hips high"],
  },
  {
    name: "BOSU Knee Tuck",
    equipment: "bosu",
    video: buildVideoPath("BOSU knee tuck.MP4"),
    muscles: ["core", "hip flexors"],
    cues: ["Keep shoulders stacked above hands", "Pull knees in tight"],
  },
  {
    name: "Bosu Russian Twists",
    equipment: "bosu",
    video: buildVideoPath("Bosu foam russian twists.MP4"),
    muscles: ["core", "obliques"],
    cues: ["Stay tall through the chest", "Rotate from the ribs"],
  },

  // Box / Plyo
  {
    name: "Box Step Up",
    equipment: "box",
    video: buildVideoPath("Plate step up.MP4"),
    muscles: ["legs", "glutes"],
    cues: ["Plant the full foot", "Drive through the heel"],
  },
  {
    name: "Box Jump Burpee",
    equipment: "box",
    video: buildVideoPath("Box jump burpee.MP4"),
    muscles: ["total body"],
    cues: ["Land softly on the box", "Keep chest lifted from the burpee"],
  },

  // Bench variations
  {
    name: "Incline Press",
    equipment: "bench",
    video: buildVideoPath("Box incline push-up.MP4"),
    muscles: ["chest", "shoulders"],
    cues: ["Lower to the box with control", "Drive through the floor"],
  },
  {
    name: "Bench Press Hold",
    equipment: "bench",
    video: buildVideoPath("DB narrow press.MP4"),
    muscles: ["chest", "triceps"],
    cues: ["Pin shoulder blades down", "Pause with elbows at 90°"],
  },

  // Cardio placeholders (mapped to SkiErg clips for now)
  {
    name: "Treadmill Run",
    equipment: "treadmill",
    video: buildVideoPath("Ski erg alt speed pulls .MP4"),
    muscles: ["cardio", "full body"],
    cues: ["Stay tall", "Drive elbows back"],
  },
  {
    name: "Bike Sprint",
    equipment: "bike",
    video: buildVideoPath("SKI erg power pulls.MP4"),
    muscles: ["cardio", "upper body"],
    cues: ["Push/pull evenly", "Keep cadence high"],
  },
];

export const EXERCISE_MEDIA = DEFAULT_EXERCISE_MEDIA;
export const FALLBACK_EXERCISE_VIDEO =
  DEFAULT_EXERCISE_MEDIA[0]?.video ?? buildVideoPath("Alt hammer curls .MP4");

export function getMediaForExercise(exerciseName: string): ExerciseMedia | null {
  return DEFAULT_EXERCISE_MEDIA.find(
    (item) => item.name.trim().toLowerCase() === exerciseName.trim().toLowerCase()
  ) || null;
}
