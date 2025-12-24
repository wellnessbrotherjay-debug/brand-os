export type ExerciseLibraryRow = {
  id: string
  exercise_name: string
  primary_muscle_group: string | null
  required_equipment: string | null
  difficulty_level: string | null
  intensity: string | null
  training_type: string | null
  video_url: string | null
  thumbnail_url: string | null
  created_at: string | null
}

export type ExerciseLibraryInsert = Omit<ExerciseLibraryRow, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type ExerciseLibraryUpdate = Partial<Omit<ExerciseLibraryRow, 'id' | 'created_at'>> & {
  id?: string
  created_at?: string
}

export type EquipmentLibraryRow = {
  id: string
  equipment_name: string
  category: string | null
  size_length: number | null
  size_width: number | null
  size_height: number | null
  weight: number | null
  required_space: number | null
  image_url: string | null
  created_at: string | null
}

export type EquipmentLibraryInsert = Omit<EquipmentLibraryRow, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type EquipmentLibraryUpdate = Partial<Omit<EquipmentLibraryRow, 'id' | 'created_at'>> & {
  id?: string
  created_at?: string
}

export type BodyScanRow = {
  id: string
  venue_id: string
  member_id: string
  member_name: string
  body_fat: number | null
  muscle_mass: number | null
  posture_score: number | null
  scan_url: string | null
  metadata: Record<string, any>
  scanned_at: string
  created_at: string
}

export type BodyScanInsert = Omit<BodyScanRow, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type BodyScanUpdate = Partial<BodyScanInsert>

export type TdeeLogRow = {
  id: string
  venue_id: string | null
  member_id: string | null
  inputs: Record<string, any>
  result: Record<string, any>
  created_by: string | null
  created_at: string
}

export type TdeeLogInsert = Omit<TdeeLogRow, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type TdeeLogUpdate = Partial<TdeeLogInsert>

export type SocialIntegrationRow = {
  id: string
  brand_id: string
  platform: string
  access_token: string
  platform_user_id: string | null
  token_expires_at: string | null
  created_at: string
  updated_at: string
}

export type SocialIntegrationInsert = Omit<SocialIntegrationRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type SocialIntegrationUpdate = Partial<SocialIntegrationInsert>

export type Database = {
  public: {
    Tables: {
      exercise_library: {
        Row: ExerciseLibraryRow
        Insert: ExerciseLibraryInsert
        Update: ExerciseLibraryUpdate
      }
      equipment_library: {
        Row: EquipmentLibraryRow
        Insert: EquipmentLibraryInsert
        Update: EquipmentLibraryUpdate
      }
      body_scans: {
        Row: BodyScanRow
        Insert: BodyScanInsert
        Update: BodyScanUpdate
      }
      tdee_logs: {
        Row: TdeeLogRow
        Insert: TdeeLogInsert
        Update: TdeeLogUpdate
      }
      social_integrations: {
        Row: SocialIntegrationRow
        Insert: SocialIntegrationInsert
        Update: SocialIntegrationUpdate
      }
      workout_programs: {
        Row: {
          id: string
          title: string
          description: string | null
          level: 'Beginner' | 'Intermediate' | 'Advanced' | null
          category: string
          duration_weeks: number | null
          frequency_per_week: number | null
          cover_image_url: string | null
          is_premium: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          level?: 'Beginner' | 'Intermediate' | 'Advanced' | null
          category: string
          duration_weeks?: number | null
          frequency_per_week?: number | null
          cover_image_url?: string | null
          is_premium?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          level?: 'Beginner' | 'Intermediate' | 'Advanced' | null
          category?: string
          duration_weeks?: number | null
          frequency_per_week?: number | null
          cover_image_url?: string | null
          is_premium?: boolean | null
          created_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          title: string
          description: string | null
          program_id: string | null
          difficulty_level: string | null
          estimated_duration_min: number | null
          cover_image_url: string | null
          video_url: string | null
          warmup_duration_min: number | null
          cooldown_duration_min: number | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          program_id?: string | null
          difficulty_level?: string | null
          estimated_duration_min?: number | null
          cover_image_url?: string | null
          video_url?: string | null
          warmup_duration_min?: number | null
          cooldown_duration_min?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          program_id?: string | null
          difficulty_level?: string | null
          estimated_duration_min?: number | null
          cover_image_url?: string | null
          video_url?: string | null
          warmup_duration_min?: number | null
          cooldown_duration_min?: number | null
          created_at?: string
        }
      }
      workout_exercises: {
        Row: {
          id: string
          workout_id: string | null
          exercise_id: string | null
          order_index: number
          sets: number | null
          reps_target: string | null
          time_target_sec: number | null
          rest_sec: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_id?: string | null
          exercise_id?: string | null
          order_index: number
          sets?: number | null
          reps_target?: string | null
          time_target_sec?: number | null
          rest_sec?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string | null
          exercise_id?: string | null
          order_index?: number
          sets?: number | null
          reps_target?: string | null
          time_target_sec?: number | null
          rest_sec?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      user_schedule: {
        Row: {
          id: string
          user_id: string | null
          scheduled_date: string
          item_type: 'workout' | 'meal' | 'class' | null
          reference_id: string | null
          status: 'pending' | 'completed' | 'missed' | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          scheduled_date: string
          item_type?: 'workout' | 'meal' | 'class' | null
          reference_id?: string | null
          status?: 'pending' | 'completed' | 'missed' | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          scheduled_date?: string
          item_type?: 'workout' | 'meal' | 'class' | null
          reference_id?: string | null
          status?: 'pending' | 'completed' | 'missed' | null
          created_at?: string
        }
      }
      user_workout_sessions: {
        Row: {
          id: string
          user_id: string | null
          workout_id: string | null
          started_at: string | null
          ended_at: string | null
          status: 'in_progress' | 'completed' | 'abandoned' | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          workout_id?: string | null
          started_at?: string | null
          ended_at?: string | null
          status?: 'in_progress' | 'completed' | 'abandoned' | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          workout_id?: string | null
          started_at?: string | null
          ended_at?: string | null
          status?: 'in_progress' | 'completed' | 'abandoned' | null
          notes?: string | null
          created_at?: string
        }
      }
      user_workout_logs: {
        Row: {
          id: string
          session_id: string | null
          exercise_id: string | null
          set_number: number
          weight_kg: number | null
          reps_completed: number | null
          rpe: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          exercise_id?: string | null
          set_number: number
          weight_kg?: number | null
          reps_completed?: number | null
          rpe?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          exercise_id?: string | null
          set_number?: number
          weight_kg?: number | null
          reps_completed?: number | null
          rpe?: number | null
          created_at?: string
        }
      }
      nutrition_daily_logs: {
        Row: {
          id: string
          user_id: string | null
          date: string
          total_calories: number | null
          total_protein_g: number | null
          total_carbs_g: number | null
          total_fats_g: number | null
          water_ml: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          date: string
          total_calories?: number | null
          total_protein_g?: number | null
          total_carbs_g?: number | null
          total_fats_g?: number | null
          water_ml?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          date?: string
          total_calories?: number | null
          total_protein_g?: number | null
          total_carbs_g?: number | null
          total_fats_g?: number | null
          water_ml?: number | null
          created_at?: string
        }
      }
      nutrition_meal_entries: {
        Row: {
          id: string
          daily_log_id: string | null
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
          food_name: string
          quantity: number | null
          unit: string | null
          calories: number | null
          protein_g: number | null
          carbs_g: number | null
          fats_g: number | null
          usda_fdc_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          daily_log_id?: string | null
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
          food_name: string
          quantity?: number | null
          unit?: string | null
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fats_g?: number | null
          usda_fdc_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          daily_log_id?: string | null
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
          food_name?: string
          quantity?: number | null
          unit?: string | null
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fats_g?: number | null
          usda_fdc_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
