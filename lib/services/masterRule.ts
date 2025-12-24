import { hrmClassPipeline } from './hrmClassPipeline';
import { workoutSessionPipeline } from './workoutSessionPipeline';

/**
 * THE MASTER RULE IMPLEMENTATION
 * 
 * This controller unifies the two modes of the application:
 * Mode 1: Group Class Experience (Executed by hrmClassPipeline)
 * Mode 2: Online Program Experience (Executed by workoutSessionPipeline)
 * 
 * Both modes follow the Golden Rule:
 * END SESSION -> COMPUTE RESULTS -> SAVE RESULTS -> SHOW RECAP
 */

export const MasterRule = {

    // --- MODE 1: GROUP CLASS EXPERIENCE ---

    Mode1: {
        // Step 2: User Books Class
        bookClass: async (userId: string, classId: string) => {
            // Trigger HRM Assignment (reserved)
            // Call booking service...
            console.log(`[Mode 1] Booking class ${classId} for ${userId}`);
        },

        // Step 4: Class Starts
        startClassSession: async (classId: string, instructor: string) => {
            console.log(`[Mode 1] Starting Class Session`);
            return await hrmClassPipeline.startClassSession({
                classId,
                location: "Studio A",
                instructorName: instructor
            });
        },

        // Step 6 & 7: Class Ends & Extraction Job
        endClassSession: async (sessionId: string, currentMetrics: any[]) => {
            console.log(`[Mode 1] Ending Class & Running Extraction Job`);
            return await hrmClassPipeline.endClassSession(sessionId, currentMetrics);
        }
    },


    // --- MODE 2: ONLINE PROGRAM EXPERIENCE ---

    Mode2: {
        // Step 2: User Selects Program
        enrollInProgram: async (userId: string, programId: string) => {
            console.log(`[Mode 2] Enrolling in program ${programId}`);
            return await workoutSessionPipeline.startProgramEnrollment(userId, programId);
        },

        // Step 3: Start Today's Workout
        startWorkout: async (userId: string, templateId: string) => {
            console.log(`[Mode 2] Starting Workout Session`);
            return await workoutSessionPipeline.startWorkoutSession({
                userId,
                templateId
            });
        },

        // Step 5 & 6: End Workout & Extraction Job
        finishWorkout: async (sessionId: string) => {
            console.log(`[Mode 2] Ending Workout & Running Extraction Job`);
            return await workoutSessionPipeline.endWorkoutSession(sessionId);
        }
    }

};
