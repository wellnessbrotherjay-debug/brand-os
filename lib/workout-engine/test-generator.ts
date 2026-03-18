import { generateWorkoutPlan } from "./generator";
import { DEFAULT_EXERCISE_MEDIA as EXERCISE_LIBRARY } from "../lib/exercise-library";

// Mock Setup
const mockSetup = {
  facilityName: "AVRL Test",
  stations: [
    { id: 1, equipment: "dumbbells", locked: true }, // Should stay dumbbells
    { id: 2, equipment: "barbell", locked: false },  // Variable
    { id: 3, equipment: "treadmill", locked: true }, // Fixed cardio
  ],
  logo: null,
  theme: "avrl",
  workTime: 45,
  restTime: 15,
  rounds: 1,
  mode: 'studio-a',
  exercisesPerStation: 1
};

function testGeneration() {
  console.log("--- Testing AI Generator ---");
  
  // Test for a specific day (e.g., Monday = Legs)
  const monday = new Date("2024-03-18"); // Monday
  const plan = generateWorkoutPlan(mockSetup as any, EXERCISE_LIBRARY, monday);
  
  console.log(`Plan Name: ${plan.name}`);
  console.log(`Scheduled Date: ${plan.scheduledDate}`);
  
  plan.exercises.forEach(ex => {
    console.log(`Station ${ex.stationId}: ${ex.name} (${ex.equipment}) - Muscles: ${ex.muscles?.join(", ")}`);
    
    // Validation
    const stationSetup = mockSetup.stations.find(s => s.id === ex.stationId);
    if (stationSetup?.locked && ex.equipment.toLowerCase() !== stationSetup.equipment.toLowerCase()) {
      console.error(`!!!! ERROR: Station ${ex.stationId} is locked to ${stationSetup.equipment} but got ${ex.equipment}`);
    }
  });

  // Test Studio B
  console.log("\n--- Testing Studio B (Dual) ---");
  const studioBSetup = { ...mockSetup, mode: 'studio-b', exercisesPerStation: 2 };
  const bPlan = generateWorkoutPlan(studioBSetup as any, EXERCISE_LIBRARY, monday);
  
  bPlan.exercises.forEach(ex => {
    console.log(`Station ${ex.stationId} Part ${ex.part}: ${ex.name} (${ex.equipment})`);
  });

  if (bPlan.exercises.length !== 6) {
    console.error(`!!!! ERROR: Studio B should have 6 exercises for 3 stations, got ${bPlan.exercises.length}`);
  } else {
    console.log("Studio B exercise count OK.");
  }
}

testGeneration();
