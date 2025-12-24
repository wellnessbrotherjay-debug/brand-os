import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

export type WorkoutProgram = Database['public']['Tables']['workout_programs']['Row'];
export type Workout = Database['public']['Tables']['workouts']['Row'];
export type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'];
export type WorkoutSession = Database['public']['Tables']['user_workout_sessions']['Row'];

export const workoutService = {
    // --- Programs & Workouts ---

    async getPrograms(category?: string) {
        let query = supabase.from('workout_programs').select('*');
        if (category && category !== 'All') {
            query = query.eq('category', category);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getProgramById(id: string) {
        const { data, error } = await supabase
            .from('workout_programs')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async getProgramWorkouts(programId: string) {
        const { data, error } = await supabase
            .from('workouts')
            .select('*')
            .eq('program_id', programId)
            .order('created_at', { ascending: true }); // Ideally order by week/day if available
        if (error) throw error;
        return data;
    },

    async getWorkoutDetails(workoutId: string) {
        // Fetch workout + exercises (and related exercise library info)
        const { data: workout, error: workoutError } = await supabase
            .from('workouts')
            .select('*')
            .eq('id', workoutId)
            .single();

        if (workoutError) throw workoutError;

        // Fetch exercises
        const { data: exercises, error: exercisesError } = await supabase
            .from('workout_exercises')
            .select(`
        *,
        exercise_library (
          exercise_name,
          video_url,
          thumbnail_url,
          instructions
        )
      `)
            .eq('workout_id', workoutId)
            .order('order_index', { ascending: true });

        if (exercisesError) throw exercisesError;

        return { ...workout, exercises };
    },

    // --- Sessions & Logging ---

    async startSession(workoutId: string, userId: string) {
        const { data, error } = await supabase
            .from('user_workout_sessions')
            .insert({
                user_id: userId,
                workout_id: workoutId,
                started_at: new Date().toISOString(),
                status: 'in_progress'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async completeSession(sessionId: string, notes?: string) {
        const { data, error } = await supabase
            .from('user_workout_sessions')
            .update({
                ended_at: new Date().toISOString(),
                status: 'completed',
                notes
            })
            .eq('id', sessionId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async logSet(sessionId: string, exerciseId: string, setNumber: number, weight: number, reps: number, rpe?: number) {
        // Check if log exists (update) or create new
        // For simplicity, we'll just upsert based on (session_id, exercise_id, set_number) if we had a constraint, 
        // but here we'll just insert since logs are usually append-only or simple edits.
        // Actually, handling re-entry:

        // First, try to find existing log
        const { data: existing } = await supabase
            .from('user_workout_logs')
            .select('id')
            .match({ session_id: sessionId, exercise_id: exerciseId, set_number: setNumber })
            .single();

        if (existing) {
            return await supabase
                .from('user_workout_logs')
                .update({ weight_kg: weight, reps_completed: reps, rpe })
                .eq('id', existing.id);
        } else {
            return await supabase
                .from('user_workout_logs')
                .insert({
                    session_id: sessionId,
                    exercise_id: exerciseId,
                    set_number: setNumber,
                    weight_kg: weight,
                    reps_completed: reps,
                    rpe
                });
        }
    },

    async getSessionLogs(sessionId: string) {
        const { data, error } = await supabase
            .from('user_workout_logs')
            .select('*')
            .eq('session_id', sessionId);
        if (error) throw error;
        return data;
    }
};
