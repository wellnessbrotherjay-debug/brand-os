import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  const supabase = createAdminClient();

  try {
    // Get session with template
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        rooms (
          id,
          name,
          qr_slug
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get template if assigned
    let template = null;
    if (session.template_slug) {
      const { data: templateData, error: templateError } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('slug', session.template_slug)
        .single();

      if (!templateError && templateData) {
        template = templateData;
      }
    }

    // Get latest events for current state
    const { data: events, error: eventsError } = await supabase
      .from('session_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('ts', { ascending: false })
      .limit(10);

    if (eventsError) {
      console.error('Events fetch error:', eventsError);
    }

    // Calculate current workout state
    const workoutState = calculateWorkoutState(session, template, events || []);

    return NextResponse.json({
      session,
      template,
      currentState: workoutState,
      recentEvents: events || [],
    });

  } catch (error) {
    console.error('Session state API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateWorkoutState(session: any, template: any, events: any[]) {
  // Default state
  let state = {
    phase: 'prep' as 'prep' | 'work' | 'rest',
    timeLeft: 30,
    currentBlock: session.current_block || 0,
    currentExercise: session.current_exercise || 0,
    isRunning: session.status === 'running',
    adaptations: session.adaptations || {},
  };

  if (!template || !template.blocks) {
    return state;
  }

  // Find relevant events to determine current state
  const startEvent = events.find(e => e.event === 'start');
  const pauseEvents = events.filter(e => e.event === 'pause');
  const resumeEvents = events.filter(e => e.event === 'resume');
  
  // Calculate time elapsed since last start/resume
  let timeElapsed = 0;
  if (startEvent && session.status === 'running') {
    const lastResumeEvent = resumeEvents.length > 0 ? resumeEvents[0] : null;
    const lastPauseEvent = pauseEvents.length > 0 ? pauseEvents[0] : null;
    
    const referenceTime = lastResumeEvent && (!lastPauseEvent || new Date(lastResumeEvent.ts) > new Date(lastPauseEvent.ts))
      ? lastResumeEvent.ts
      : startEvent.ts;
    
    timeElapsed = Math.floor((Date.now() - new Date(referenceTime).getTime()) / 1000);
  }

  // Get current exercise from template
  const currentBlockExercises = template.blocks[state.currentBlock] || [];
  const currentExercise = currentBlockExercises[state.currentExercise] || null;

  if (currentExercise) {
    // Apply adaptations
    const adaptationKey = currentExercise.slug;
    const adaptation = state.adaptations[adaptationKey] || 0;
    
    const workTime = Math.max(10, Math.round(currentExercise.work_s * (1 + adaptation * 0.2)));
    const restTime = Math.max(5, Math.round(currentExercise.rest_s * (1 - adaptation * 0.1)));
    
    // Determine current phase and time left
    if (timeElapsed < workTime) {
      state.phase = 'work';
      state.timeLeft = workTime - timeElapsed;
    } else {
      state.phase = 'rest';
      state.timeLeft = restTime - (timeElapsed - workTime);
    }
  }

  return state;
}
