import { createClient } from "@supabase/supabase-js";

// Base URL for the Exequte API (same as Mini Program)
// Note: You need to confirm the exact domain. Assuming it's the one used in the MP.
// If it was in app.js globalData, we might need to assume or ask. 
// For now, I will use a placeholder environment variable or a likely default.
const BASE_URL = process.env.NEXT_PUBLIC_EXEQUTE_API_URL || "https://admin.exequte.cn/api/v1";

// Helper for requests
async function request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("exequte_token"); // Persist token logic needed
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const json = await response.json();
    if (!response.ok) {
        throw new Error(json.error?.message || "API request failed");
    }
    return json.data;
}

// --- HRM VIEWER API ---

export async function getHrmDataGraphForBooking(bookingId: string, force: boolean = false) {
    return request(`/hrms/get_data_graph?bookingId=${bookingId}&force=${force}`);
}

export async function getHrmDataForBooking(bookingId: string) {
    return request(`/hrms/get_data?bookingId=${bookingId}`);
}

// --- FITNESS TEST (LOGGED WORKOUTS) API ---

export interface LoggedExerciseInput {
    id: string; // Exercise ID
    [key: string]: any; // dynamic attributes (weight, reps, time)
}

export async function submitLoggedWorkout(workoutId: string, exercises: LoggedExerciseInput[]) {
    // Transformation to match MP structure: 
    // The MP sends a flat list where each attribute modification is an entry or a consolidated object.
    // The code showed: let request_payload = { "logged_exercises" : loggedExercises }
    return request(`/logged_workouts/${workoutId}/log_workout`, {
        method: "POST",
        body: JSON.stringify({ logged_exercises: exercises }),
    });
}

export async function approveLoggedWorkout(workoutId: string, validatedBy: string) {
    return request(`/logged_workouts/${workoutId}/approve_workout`, {
        method: "POST",
        body: JSON.stringify({ validated_by: validatedBy }),
    });
}

export async function getLoggedExercisesHistory(exerciseId: string) {
    return request(`/logged_exercises/${exerciseId}/show_all_by_logged_exercise_id`);
}

// --- USER PROFILE API ---

export async function getUserInfo() {
    return request(`/users/info`);
}

export async function updateUserProfile(userId: string, data: any) {
    return request(`/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}
