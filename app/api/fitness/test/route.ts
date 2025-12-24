import { NextRequest, NextResponse } from 'next/server';
import { FitnessTestSchema } from '@/lib/types/hotel-fitness';
import { calculateFitnessScores } from '@/lib/utils/fitness-calculations';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();

  try {
    const body = await req.json();
    
    // Validate input with Zod
    const validatedData = FitnessTestSchema.parse(body);
    
    const {
      user_id,
      session_id,
      age,
      height_cm,
      weight_kg,
      body_fat_pct,
      sex,
      level_self,
      max_pushups = 0,
      squats_60s = 0,
      plank_hold_sec = 0,
      step_test_hr = 100,
    } = validatedData;

    // Calculate fitness scores
    const scores = calculateFitnessScores(
      max_pushups,
      squats_60s,
      plank_hold_sec,
      step_test_hr,
      age,
      sex
    );

    // Insert fitness test record
    const { data: fitnessTest, error: fitnessError } = await supabase
      .from('fitness_tests')
      .insert({
        user_id,
        session_id,
        age,
        height_cm,
        weight_kg,
        body_fat_pct,
        level_self,
        max_pushups,
        squats_60s,
        plank_hold_sec,
        step_test_hr,
        computed_level: scores.overall,
        mapped_band: scores.level,
      })
      .select()
      .single();

    if (fitnessError) {
      console.error('Fitness test insert error:', fitnessError);
      return NextResponse.json(
        { error: 'Failed to save fitness test results' },
        { status: 500 }
      );
    }

    // Update session status to 'ready'
    const { error: sessionError } = await supabase
      .from('workout_sessions')
      .update({ 
        status: 'ready',
        template_slug: `bodyweight-${scores.level}`, // Default template based on level
      })
      .eq('id', session_id);

    if (sessionError) {
      console.error('Session update error:', sessionError);
      // Don't fail the request if session update fails
    }

    // Create user profile if user_id provided
    if (user_id) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user_id,
          height_cm,
          weight_kg,
          body_fat_pct,
          sex,
        });

      if (profileError) {
        console.error('Profile upsert error:', profileError);
        // Don't fail the request if profile update fails
      }
    }

    return NextResponse.json({
      level: scores.level,
      score: scores.overall,
      breakdown: {
        pushups: scores.pushups,
        squats: scores.squats,
        plank: scores.plank,
        cardio: scores.cardio,
      },
      template_suggestion: `bodyweight-${scores.level}`,
      record: fitnessTest,
    });

  } catch (error) {
    console.error('Fitness test API error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
