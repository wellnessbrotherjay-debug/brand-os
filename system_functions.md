# System Functions extraction: Exequte Mini Program

## 1. API Layer Overview
The Mini Program uses a generic request wrapper (`request.js`) that handles authentication and base URLs.
*   **Base URL**: Configured in `app.globalData.BASE_URL`.
*   **Headers**: `app.globalData.headers` (likely contains Auth Token).
*   **Response Handling**: Wraps successful (200) responses and extracts `resp.data.data`.

## 2. Feature: HRM (Heart Rate Monitoring)
**File**: `pages/hrm-data/hrm-data.js`
**Logic**: The Mini Program acts as a **viewer** for server-processed data. It does **not** connect to Bluetooth devices directly.

### API Endpoints
*   `GET /hrms/get_data_graph`
    *   **Params**: `bookingId`, `force` (boolean refresh)
    *   **Returns**: 
        *   `hrm_data`: Raw or aggregated stats (implies backend parsing).
        *   `hrm_combined_graph`: URL to a generated graph image.
        *   `ranking`: List of participants sorted by performance.
        *   `my_ranking`: Current user's specific rank.

*   `GET /hrms/get_data?bookingId=...` (Raw data fetch)
*   `GET /hrms/get_graph?bookingId=...` (Graph only)

## 3. Feature: Fitness Test (Body Scans / Logged Workouts)
**File**: `pages/fitness-test/fitness-test.js`
**Logic**: Manages "Logged Workouts" where users execute a workout linked to a booking and manually input results (or results are pre-filled).

### Data Model: Logged Workout
*   **ID**: Linked to `booking.workout.id`.
*   **Validation Status**: `pending`, `approved`, `denied`.
*   **Exercises**: stored as `logged_exercises`.

### API Endpoints
*   `POST /logged_workouts/{workoutId}/log_workout`
    *   **Payload**: `{ "logged_exercises": [ { "id": "exercise_id", "attribute": "value" }, ... ] }`
*   `POST /logged_workouts/{workoutId}/approve_workout`
    *   **Payload**: `{ "validated_by": "User Name" }`
*   `POST /logged_workouts/{workoutId}/deny_workout`
    *   **Payload**: `{ "validated_by": "User Name" }`
*   `GET /logged_exercises/{exerciseId}/show_all_by_logged_exercise_id`
    *   **Purpose**: Fetches historical performance for a specific exercise to show progress.

## 4. Feature: Client Data (Profile)
**File**: `pages/profile/profile.js`, `pages/profile-update/profile-update.js`
**Logic**: Manages user profile, biometrics, and waiver signing.

### Data Model: User
*   **Identity**: `first_name`, `last_name`, `phone`, `mp_email`.
*   **Biometrics**: `current_weight` (Required for HRM calories), `birthday` (Required for calories/zones), `gender`.
*   **Settings**: `workout_name` (Nickname), `waiver_signed` (Boolean), `waiver_signed_at`.
*   **Emergency**: `emergency_name`, `emergency_phone`.

### Validation Rules (Client-Side)
*   **Required**: First Name, Last Name, Phone, Birthday, Gender, Weight, Workout Name.
*   **Optional**: Email, Emergency Contact.

### API Endpoints
*   `GET /users/info`: Get current logged-in user.
*   `GET /users/{id}`: Get specific user details.
*   `PUT /users/{id}`: Update profile fields.
*   `PUT /users/{id}/wechat_avatar`: Update avatar URL.
*   `POST /users/{id}/avatar`: Upload avatar image file.
