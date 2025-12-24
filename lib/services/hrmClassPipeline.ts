import { createClient } from '@supabase/supabase-js';
import { type HRMMetrics, HR_ZONES } from '@/lib/workout-engine/hrm-types';

// Initialize Supabase client (ensure env vars are set in real usage)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TYPES ---

export interface ClassSessionInput {
    classId: string;
    location: string;
    instructorName?: string;
    roomName?: string;
}

export interface ClassResultsSummary {
    sessionId: string;
    totalParticipants: number;
    avgCalories: number;
    topPerformer: string;
}

// --- PIPELINE SERVICE ---

export const hrmClassPipeline = {

    /**
     * 1. START CLASS
     * Creates the session and moves "reserved" assignments to "active" participants
     */
    async startClassSession(input: ClassSessionInput) {
        console.log(`Starting class: ${input.classId} at ${input.location}`);

        // A. Create Session
        const { data: session, error: sessionError } = await supabase
            .from('hrm_class_sessions')
            .insert({
                class_id: input.classId,
                location: input.location,
                instructor_name: input.instructorName,
                status: 'active',
                starts_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (sessionError) {
            console.error("Error creating session:", sessionError);
            throw sessionError;
        }

        // B. Activate Participants (Simulated: grabbing all active assignments for this location/class)
        // In a real flow, you'd match by booking_id or simple "checked-in" status
        // For now, we perform a "migration" of assignments -> participants
        // const { error: partError } = await supabase.rpc('activate_session_participants', { session_id: session.id });

        return session;
    },

    /**
     * 2. END CLASS & COMPUTE RESULTS
     * This is the critical "Golden Rule" job.
     */
    async endClassSession(sessionId: string, finalMetrics: HRMMetrics[]): Promise<ClassResultsSummary> {
        console.log(`Ending session: ${sessionId}`);

        // A. Close the Session
        await supabase
            .from('hrm_class_sessions')
            .update({
                status: 'completed',
                ends_at: new Date().toISOString()
            })
            .eq('id', sessionId);

        // B. COMPUTE RESULTS (The Extraction Job)
        // In a real system, we'd query `hrm_samples` between starts_at and ends_at.
        // Here, we accept `finalMetrics` which is the in-memory state from hrm-storage 
        // at the moment the class ended (since we are streaming).

        const results = finalMetrics.map(metric => {
            // Calculate Effort Score (Simple Formula: points based on zones)
            // Since we don't have exact seconds-in-zone from the simple metrics object,
            // we project it based on intensity or usage. 
            // REAL IMPLEMENTATION: Sum(zone_i_seconds * i)

            const effortScore = metric.calories * (metric.averageHR / 150); // Proxy formula

            return {
                session_id: sessionId,
                user_id: metric.userId, // Assuming mapped correctly
                avg_hr: metric.averageHR,
                max_hr: metric.maxHR,
                min_hr: 60, // Placeholder
                calories_est: metric.calories,
                effort_score: Math.round(effortScore),
                zone_1_sec: 0, // Need granular data for this
                zone_2_sec: 0,
                zone_3_sec: 0,
                zone_4_sec: 0,
                zone_5_sec: 0,
                rank_overall: 0, // Calculated next
            };
        });

        // C. RANKING
        results.sort((a, b) => b.effort_score - a.effort_score);
        results.forEach((r, idx) => r.rank_overall = idx + 1);

        // D. SAVE RESULTS
        if (results.length > 0) {
            const { error: resultsError } = await supabase
                .from('hrm_session_results')
                .insert(results);

            if (resultsError) console.error("Error saving results:", resultsError);
        }

        // E. CREATE CLASS RECAP
        const totalCals = results.reduce((sum, r) => sum + r.calories_est, 0);
        const avgCals = results.length > 0 ? Math.round(totalCals / results.length) : 0;
        const topPerformer = results.length > 0 ? results[0].user_id : "None";

        await supabase
            .from('hrm_class_recaps')
            .insert({
                session_id: sessionId,
                total_calories: totalCals,
                participant_count: results.length,
                avg_effort_score: results.length > 0 ? results.reduce((sum, r) => sum + r.effort_score, 0) / results.length : 0,
                summary_data: {
                    top_performers: results.slice(0, 3).map(r => r.user_id),
                    class_averages: { calories: avgCals }
                }
            });

        return {
            sessionId,
            totalParticipants: results.length,
            avgCalories: avgCals,
            topPerformer
        };
    }
};
