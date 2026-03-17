export interface HRM {
  id: string;
  name: string;
  hub: string;
  displayName: string;
  isUsed: boolean;
  batteryLevel?: number;
  connectionStatus?: 'connected' | 'disconnected' | 'connecting';
}

export interface HRMAssignment {
  id: string;
  hrmId: string;
  sessionId: string;
  userId: string;
  userName: string;
  weight?: number; // Added for calorie calc
  age?: number; // Added for calorie calc
  gender?: 'male' | 'female'; // Added for calorie calc
  assigned: boolean;
  assignedAt: string;
}

export interface HeartRateData {
  id: string;
  bookingId: string;
  hrmId: string;
  timestamp: string;
  heartRate: number;
  calories: number;
  zone: 1 | 2 | 3 | 4 | 5; // HR zones 1-5
  intensity: number; // percentage
}

export interface HRMGraphData {
  bookingId: string;
  hrmDataRaw: number[];
  hrmData: {
    average: number;
    max: number;
    min: number;
    calories: number;
    zones: Record<string, number>;
  };
  hrmGraph: string; // base64 image
  hrmZoneGraph: string; // base64 image
  hrmCombinedGraph: string; // base64 image
}

export interface WorkoutSession {
  id: string;
  location: string;
  currentBlock: string;
  beginsAt: string;
  status: 'preparing' | 'active' | 'rest' | 'complete';
  participants: HRMAssignment[];
  currentPhase: 'prep' | 'work' | 'rest' | 'change' | 'complete';
  remaining: number;
}

export interface HRMMetrics {
  userId: string;
  userName: string;
  hrmId: string;
  currentHR: number;
  averageHR: number;
  maxHR: number;
  calories: number;
  zone: number;
  intensity: number;
  rank: number;
  isActive: boolean;
}

// Heart Rate Zones
export const HR_ZONES = {
  1: { name: 'Recovery', color: '#9CA3AF', min: 50, max: 60 },
  2: { name: 'Base', color: '#F1EDE5', min: 60, max: 70 }, // Beige
  3: { name: 'Aerobic', color: '#FFFFFF', min: 70, max: 80 }, // White
  4: { name: 'Threshold', color: '#C8A871', min: 80, max: 90 }, // Gold
  5: { name: 'VO2 Max', color: '#FF4D4D', min: 90, max: 100 } // Red
} as const;

export type HRZone = keyof typeof HR_ZONES;