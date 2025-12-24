import { createClient } from '@supabase/supabase-js';
import { hrmStorage } from '../workout-engine/hrm-storage';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TYPES ---
export interface WorkoutSessionInput {
    userId: string;
    templateId: string; // The workout being done
    roomId?: string; // If in a hotel room (UUID)
    location?: string; // Generic location name (e.g. "Studio A")
}

export interface WorkoutResultsSummary {
    sessionId: string;
    durationMin: number;
    totalVolume: number;
    calories: number;
    effortScore: number;
}

// --- PIPELINE SERVICE ---

export const workoutSessionPipeline = {

    /**
     * 1. START PROGRAM (Mode 2 Step 2)
     */
    async startProgramEnrollment(userId: string, programId: string, sessions: any[] = []) {
        const { data, error } = await supabase
            .from('program_enrollments')
            .insert({
                user_id: userId,
                program_id: programId,
                status: 'active',
                start_date: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // Initialize progress tracking
        await supabase.from('program_progress').insert({
            enrollment_id: data.id,
            user_id: userId,
            workouts_completed: 0,
            current_streak_days: 0
        });

        // 1.1 GENERATE SCHEDULE (Trainerize Style)
        // Create schedule items for each session starting today
        if (sessions && sessions.length > 0) {
            const scheduleInserts = sessions.map((session, index) => {
                const date = new Date();
                date.setDate(date.getDate() + index); // Day 1 = Today, Day 2 = Tomorrow...

                return {
                    user_id: userId,
                    scheduled_date: date.toISOString().split('T')[0],
                    item_type: 'workout',
                    title: session.name, // "Day 1: Introduction"
                    reference_id: programId, // Linking back to program for now
                    status: 'pending',
                    // metadata: { duration: session.duration, type: session.type } // If we had metadata col
                };
            });

            await supabase.from('user_schedule').insert(scheduleInserts);
        }

        return data;
    },

    /**
     * 2. START WORKOUT (Mode 2 Step 3)
     */
    async startWorkoutSession(input: WorkoutSessionInput) {
        console.log(`Starting workout for user ${input.userId}`);

        // Create Session
        const { data: session, error } = await supabase
            .from('workout_sessions')
            .insert({
                user_id: input.userId,
                // template_id: input.templateId, // Need to ensure column exists or use slug
                status: 'running',
                started_at: new Date().toISOString(),
                room_id: input.roomId,
                location: input.location
            })
            .select()
            .single();

        if (error) throw error;

        // Initialize Local Storage for HRM
        if (session) {
            // Create a temporary assignment for the user to track them in this session
            const tempAssignment: any = {
                id: `assign-${session.id}-${input.userId}`,
                hrmId: `hrm-auto-${input.userId}`,
                sessionId: session.id,
                userId: input.userId,
                userName: 'User',
                assigned: true,
                assignedAt: new Date().toISOString()
            };

            hrmStorage.setCurrentSession({
                id: session.id,
                location: input.roomId || 'gym',
                currentBlock: 'active',
                beginsAt: session.started_at,
                status: 'active',
                participants: [tempAssignment],
                currentPhase: 'work',
                remaining: 45
            });
            // Also update any existing HRM assignments to use this session ID if needed, 
            // but for single user mode we assume metrics will just flow.
        }

        return session;
    },

    /**
     * 3. END WORKOUT & EXTRACT RESULTS (Mode 2 Step 6)
     * The "Extraction Job" for Online Programs
     */
    async endWorkoutSession(sessionId: string): Promise<WorkoutResultsSummary> {
        console.log(`Ending workout session: ${sessionId}`);

        // A. Close Session (and get start time for duration calc)
        const endTime = new Date();
        const { data: sessionData, error: updateError } = await supabase
            .from('workout_sessions')
            .update({
                status: 'done',
                ended_at: endTime.toISOString()
            })
            .eq('id', sessionId)
            .select('started_at, user_id') // Get start time
            .single();

        if (updateError) throw updateError;

        // B. COMPUTE RESULTS (Extraction)
        // 1. Fetch Logs
        const { data: logs } = await supabase
            .from('workout_logs')
            .select('*')
            .eq('session_id', sessionId);

        // 2. Fetch HRM Data from Local Storage (Client-side source of truth for this session)
        // In a real app, this might sync to 'hrm_samples' periodically, but here we extract locally
        const hrmData = hrmStorage.getHeartRateData().filter(d => d.bookingId === sessionId);

        // Also clear the current session from local storage
        hrmStorage.setCurrentSession(null);

        // 3. Calculate Metrics
        let totalVolume = 0;
        let totalReps = 0;

        if (logs) {
            // Assume logs have structure to calculating volume
            // metrics: { sets: [{weight: 100, reps: 5}, ...] }
            // specific logic depends on jsonb structure
            // Placeholder logic for now
            totalReps = logs.length * 10;
        }

        // HR Metrics
        let avgHr = 0;
        let maxHr = 0;
        let calories = 0;

        if (hrmData && hrmData.length > 0) {
            const totalHr = hrmData.reduce((sum, s) => sum + s.heartRate, 0);
            avgHr = Math.round(totalHr / hrmData.length);
            maxHr = Math.max(...hrmData.map(s => s.heartRate));
            // Calories are cumulative in hrmData from simulation, take the last one or sum difference?
            // Simulation adds to 'calories' property. If it's cumulative, take max.
            calories = Math.max(...hrmData.map(s => s.calories));
        }

        // Calculate Duration
        let durationMin = 0;
        if (sessionData && sessionData.started_at) {
            const start = new Date(sessionData.started_at).getTime();
            const end = endTime.getTime();
            durationMin = Math.round((end - start) / 60000);
        } else {
            durationMin = 45; // Fallback
        }

        // C. SAVE SESSION RESULTS
        const { error: resultError } = await supabase
            .from('workout_session_results')
            .insert({
                session_id: sessionId,
                user_id: sessionData?.user_id || "unknown",
                duration_min: durationMin,
                total_volume_kg: totalVolume,
                total_reps: totalReps,
                calories_est: calories,
                avg_hr: avgHr,
                max_hr: maxHr,
                effort_score: avgHr > 130 ? 8 : 5 // mocked logic
            });

        if (resultError) console.error("Error saving workout results", resultError);

        // D. UPDATE PROGRESS
        // Increment workouts_completed in program_progress...
        // logic to find active enrollment needed

        return {
            sessionId,
            durationMin,
            totalVolume,
            calories,
            effortScore: avgHr > 130 ? 8 : 5
        };
    }
};
