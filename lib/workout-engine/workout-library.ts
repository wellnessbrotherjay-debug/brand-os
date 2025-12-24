import type { WorkoutPlan } from './storage'

export type WorkoutLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export type TrainingType =
  | 'Strength'
  | 'Endurance'
  | 'HIIT'
  | 'Cardio'
  | 'Mobility'
  | 'MindBody'

export interface WorkoutTemplate {
  id: string
  name: string
  description: string
  level: WorkoutLevel
  trainingType: TrainingType
  durationMinutes: number
  equipment: string[]
  rounds: number
  workTimeSeconds: number
  restTimeSeconds: number
  plan: WorkoutPlan
}

export const WORKOUT_LIBRARY: WorkoutTemplate[] = [
  {
    id: 'hotel-hiit-blast',
    name: 'Hotel HIIT Blast',
    description: 'Explosive intervals that keep the heart rate high with minimal equipment.',
    level: 'Intermediate',
    trainingType: 'HIIT',
    durationMinutes: 25,
    equipment: ['Bodyweight', 'Dumbbells'],
    rounds: 3,
    workTimeSeconds: 45,
    restTimeSeconds: 20,
    plan: {
      goal: 'Fat Loss',
      exercises: [
        { stationId: 1, name: 'Burpee Lunges' },
        { stationId: 2, name: 'Dumbbell Thrusters' },
        { stationId: 3, name: 'Mountain Climbers' },
        { stationId: 4, name: 'Alternating Split Jumps' },
        { stationId: 5, name: 'Plank Rows' },
        { stationId: 6, name: 'Skater Bounds' }
      ]
    }
  },
  {
    id: 'sunrise-strength-circuit',
    name: 'Sunrise Strength Circuit',
    description: 'Foundational lifting pattern to start the day feeling strong.',
    level: 'Beginner',
    trainingType: 'Strength',
    durationMinutes: 30,
    equipment: ['Kettlebell', 'Resistance Bands', 'Bench'],
    rounds: 4,
    workTimeSeconds: 50,
    restTimeSeconds: 25,
    plan: {
      goal: 'Strength',
      exercises: [
        { stationId: 1, name: 'Goblet Squat' },
        { stationId: 2, name: 'Single Arm Row' },
        { stationId: 3, name: 'Band Chest Press' },
        { stationId: 4, name: 'Step Up Knee Drive' },
        { stationId: 5, name: 'Deadbug Reach' }
      ]
    }
  },
  {
    id: 'mobility-reset-flow',
    name: 'Mobility Reset Flow',
    description: 'Controlled mobility work to reset joints after travel.',
    level: 'Beginner',
    trainingType: 'Mobility',
    durationMinutes: 20,
    equipment: ['Mat'],
    rounds: 2,
    workTimeSeconds: 60,
    restTimeSeconds: 15,
    plan: {
      goal: 'Endurance',
      exercises: [
        { stationId: 1, name: 'Worlds Greatest Stretch' },
        { stationId: 2, name: 'Thoracic Openers' },
        { stationId: 3, name: '90/90 Hip Switch' },
        { stationId: 4, name: 'Prone Swimmers' },
        { stationId: 5, name: 'Glute Bridge March' }
      ]
    }
  },
  {
    id: 'endurance-engine',
    name: 'Endurance Engine',
    description: 'Sustained cardio effort with strength finishers.',
    level: 'Advanced',
    trainingType: 'Endurance',
    durationMinutes: 40,
    equipment: ['Treadmill', 'Row Erg', 'Battle Rope', 'Medicine Ball'],
    rounds: 4,
    workTimeSeconds: 60,
    restTimeSeconds: 30,
    plan: {
      goal: 'Endurance',
      exercises: [
        { stationId: 1, name: 'Treadmill Tempo Run' },
        { stationId: 2, name: 'Row Erg Power Intervals' },
        { stationId: 3, name: 'Battle Rope Slams' },
        { stationId: 4, name: 'Medicine Ball Slams' },
        { stationId: 5, name: 'Bike Sprint' }
      ]
    }
  },
  {
    id: 'upper-body-power',
    name: 'Upper Body Power',
    description: 'Press, pull, and core segments to build a strong upper body.',
    level: 'Intermediate',
    trainingType: 'Strength',
    durationMinutes: 28,
    equipment: ['Cable Tower', 'Dumbbells', 'TRX'],
    rounds: 3,
    workTimeSeconds: 50,
    restTimeSeconds: 20,
    plan: {
      goal: 'Strength',
      exercises: [
        { stationId: 1, name: 'Cable Chest Fly' },
        { stationId: 2, name: 'TRX Row' },
        { stationId: 3, name: 'Single Arm Shoulder Press' },
        { stationId: 4, name: 'Tall Kneeling Pulldown' },
        { stationId: 5, name: 'Hollow Body Hold' }
      ]
    }
  },
  {
    id: 'cardio-core-crush',
    name: 'Cardio Core Crush',
    description: 'Core stability paired with fast-paced cardio drills.',
    level: 'Advanced',
    trainingType: 'Cardio',
    durationMinutes: 22,
    equipment: ['Jump Rope', 'Sliders', 'Medicine Ball'],
    rounds: 3,
    workTimeSeconds: 40,
    restTimeSeconds: 20,
    plan: {
      goal: 'Fat Loss',
      exercises: [
        { stationId: 1, name: 'Jump Rope Sprints' },
        { stationId: 2, name: 'Slider Body Saw' },
        { stationId: 3, name: 'Medicine Ball Russian Twist' },
        { stationId: 4, name: 'High Knees' },
        { stationId: 5, name: 'Plank Jack Reach' }
      ]
    }
  },
  {
    id: 'yoga-flow-unwind',
    name: 'Yoga Flow Unwind',
    description: 'Gentle flow designed to reduce stress and lengthen muscles.',
    level: 'Beginner',
    trainingType: 'MindBody',
    durationMinutes: 18,
    equipment: ['Mat', 'Yoga Block'],
    rounds: 2,
    workTimeSeconds: 75,
    restTimeSeconds: 15,
    plan: {
      goal: 'Endurance',
      exercises: [
        { stationId: 1, name: 'Sun Salutation A' },
        { stationId: 2, name: 'Warrior II Flow' },
        { stationId: 3, name: 'Low Lunge Twist' },
        { stationId: 4, name: 'Seated Forward Fold' },
        { stationId: 5, name: 'Supine Twist' }
      ]
    }
  },
  {
    id: 'speed-ladder-session',
    name: 'Speed Ladder Session',
    description: 'Quick bursts that sharpen agility and footwork.',
    level: 'Intermediate',
    trainingType: 'Cardio',
    durationMinutes: 15,
    equipment: ['Agility Ladder', 'Cones'],
    rounds: 4,
    workTimeSeconds: 30,
    restTimeSeconds: 15,
    plan: {
      goal: 'Fat Loss',
      exercises: [
        { stationId: 1, name: 'In & Out Ladder Run' },
        { stationId: 2, name: 'Lateral High Knees' },
        { stationId: 3, name: 'Cone Shuffle Sprint' },
        { stationId: 4, name: 'Quick Feet Tap' },
        { stationId: 5, name: 'Drop Squat Pop' }
      ]
    }
  },
  {
    id: 'total-body-tuneup',
    name: 'Total Body Tune-Up',
    description: 'Balanced routine for travelers wanting an all-in-one session.',
    level: 'Beginner',
    trainingType: 'HIIT',
    durationMinutes: 25,
    equipment: ['Bodyweight', 'Mini Band'],
    rounds: 3,
    workTimeSeconds: 45,
    restTimeSeconds: 20,
    plan: {
      goal: 'Fat Loss',
      exercises: [
        { stationId: 1, name: 'Mini Band Squat Pulse' },
        { stationId: 2, name: 'Push Up Reach' },
        { stationId: 3, name: 'Reverse Lunge Knee Drive' },
        { stationId: 4, name: 'Bear Crawl Hold' },
        { stationId: 5, name: 'Standing Oblique Crunch' }
      ]
    }
  },
  {
    id: 'hotel-athlete-strong',
    name: 'Hotel Athlete Strong',
    description: 'Athletic strength sequence with power finishers.',
    level: 'Advanced',
    trainingType: 'Strength',
    durationMinutes: 35,
    equipment: ['Barbell', 'Dumbbells', 'Sled'],
    rounds: 4,
    workTimeSeconds: 55,
    restTimeSeconds: 25,
    plan: {
      goal: 'Strength',
      exercises: [
        { stationId: 1, name: 'Barbell Front Squat' },
        { stationId: 2, name: 'Dumbbell Renegade Row' },
        { stationId: 3, name: 'Sled Push' },
        { stationId: 4, name: 'Single Leg Romanian Deadlift' },
        { stationId: 5, name: 'Plyometric Push Up' }
      ]
    }
  }
]
