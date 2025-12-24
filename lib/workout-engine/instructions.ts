const EXERCISE_TIPS: Record<string, string[]> = {
  "Walking Lunge": [
    "Keep chest tall and core braced as you step forward.",
    "Drop the back knee toward the floor without slamming it.",
    "Drive through the front heel to return to standing."
  ],
  "Push-Up": [
    "Stack wrists under shoulders with a strong plank line.",
    "Lower chest just above floor while keeping elbows at 45°.",
    "Press the ground away and squeeze glutes at the top."
  ],
  "TRX Row": [
    "Walk feet forward to increase difficulty while keeping body straight.",
    "Pull handles to ribs, squeezing shoulder blades together.",
    "Control the descent—no dropping or shrugging the shoulders."
  ],
  "BOSU Side Plank Hip Drops": [
    "Anchor forearm under shoulder with rib cage lifted.",
    "Lower hips toward the BOSU with control; tap lightly.",
    "Drive hips back up while squeezing obliques and glutes."
  ],
  "Barbell Shoulder Press": [
    "Stand tall, brace core, and grip the bar just outside shoulders.",
    "Press overhead while keeping ribs down and elbows under bar.",
    "Control the descent to collarbone height before the next rep."
  ],
  "Treadmill Run": [
    "Set pace before countdown and stay in the midline of the deck.",
    "Relax shoulders, drive arms, and keep steps light.",
    "Finish strong, then carefully step to the side rails before rest."
  ],
  "Box Step Up": [
    "Plant entire foot on the box and drive through the heel.",
    "Stay tall at the top—no collapsing hips.",
    "Control the lower and alternate lead legs."
  ],
  "Bench Press Hold": [
    "Plant feet into floor and pack shoulders down the bench.",
    "Lower bar to mid-chest and hold with elbows at 90°.",
    "Keep breath steady—brace core and squeeze glutes."
  ],
  "Bike Sprint": [
    "Set resistance first, then explode into the drive.",
    "Relax grip; power should come from legs and glutes.",
    "Recover seated with deep breaths during rest window."
  ]
};

const DEFAULT_TIPS = [
  "Maintain athletic posture and breathe intentionally.",
  "Follow coach instructions and stay smooth between stations."
];

export function getExerciseInstructions(exerciseName?: string): string[] {
  if (!exerciseName) return DEFAULT_TIPS;
  return EXERCISE_TIPS[exerciseName] ?? DEFAULT_TIPS;
}
