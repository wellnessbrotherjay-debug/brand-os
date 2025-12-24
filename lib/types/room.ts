export interface Room {
  id: string;
  number: string;
  floor: number;
  type: 'standard' | 'suite' | 'deluxe';
  status: 'available' | 'occupied' | 'maintenance';
  tvCode: string; // Unique code for TV pairing
  lastActive: string; // ISO date string
  currentSession?: string; // Current workout session ID if any
}

export interface RoomSession {
  id: string;
  roomId: string;
  userId?: string;
  startedAt: string;
  endedAt?: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  workoutTemplate?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  adaptiveDifficulty: boolean;
}

export interface SessionEvent {
  id: string;
  sessionId: string;
  type: 'start' | 'pause' | 'resume' | 'skip' | 'complete' | 'difficulty_change';
  timestamp: string;
  data?: {
    difficulty?: 'easier' | 'harder';
    skippedTo?: number;
    reason?: string;
  };
}