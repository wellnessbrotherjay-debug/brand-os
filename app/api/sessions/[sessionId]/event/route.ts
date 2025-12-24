import { NextRequest, NextResponse } from 'next/server';
import { SessionEventSchema } from '@/lib/types/hotel-fitness';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  const supabase = createAdminClient();

  try {
    const body = await req.json();
    
    // Validate input
    const validatedData = SessionEventSchema.parse(body);
    const { event, payload } = validatedData;

    // Get current session
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Process the event and update session state
    const updates = await processSessionEvent(session, event, payload);

    // Insert event record
    const { error: eventError } = await supabase
      .from('session_events')
      .insert({
        session_id: sessionId,
        event,
        payload,
      });

    if (eventError) {
      console.error('Event insert error:', eventError);
      return NextResponse.json(
        { error: 'Failed to log event' },
        { status: 500 }
      );
    }

    // Update session if needed
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('workout_sessions')
        .update(updates)
        .eq('id', sessionId);

      if (updateError) {
        console.error('Session update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update session' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      success: true,
      event,
      updates,
    });

  } catch (error) {
    console.error('Session event API error:', error);
    
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

async function processSessionEvent(
  session: any,
  event: string,
  payload: any
): Promise<Record<string, any>> {
  const updates: Record<string, any> = {};

  switch (event) {
    case 'start':
      updates.status = 'running';
      updates.started_at = new Date().toISOString();
      break;

    case 'pause':
      updates.status = 'paused';
      break;

    case 'resume':
      updates.status = 'running';
      break;

    case 'skip':
      // Advance to next exercise or block
      const template = await getTemplate(session.template_slug);
      if (template && template.blocks) {
        const currentBlock = template.blocks[session.current_block];
        if (currentBlock && session.current_exercise + 1 < currentBlock.length) {
          // Next exercise in same block
          updates.current_exercise = session.current_exercise + 1;
        } else if (session.current_block + 1 < template.blocks.length) {
          // Next block
          updates.current_block = session.current_block + 1;
          updates.current_exercise = 0;
        } else {
          // Workout complete
          updates.status = 'done';
          updates.ended_at = new Date().toISOString();
        }
      }
      break;

    case 'easier':
    case 'harder':
      // Apply difficulty adaptation
      const adaptations = { ...session.adaptations };
      const currentExerciseSlug = payload.exercise_slug;
      
      if (currentExerciseSlug) {
        const currentAdaptation = adaptations[currentExerciseSlug] || 0;
        const adjustment = event === 'easier' ? -0.5 : 0.5;
        adaptations[currentExerciseSlug] = Math.max(-2, Math.min(2, currentAdaptation + adjustment));
        updates.adaptations = adaptations;
      }
      break;

    case 'complete_block':
      // Move to next block
      const blockTemplate = await getTemplate(session.template_slug);
      if (blockTemplate && blockTemplate.blocks) {
        if (session.current_block + 1 < blockTemplate.blocks.length) {
          updates.current_block = session.current_block + 1;
          updates.current_exercise = 0;
        } else {
          updates.status = 'done';
          updates.ended_at = new Date().toISOString();
        }
      }
      break;

    case 'rep_log':
      // Just log the event, no session updates needed
      break;

    default:
      console.warn('Unknown event type:', event);
  }

  return updates;
}

async function getTemplate(templateSlug?: string) {
  if (!templateSlug) return null;

  const supabase = createAdminClient();
  
  const { data } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('slug', templateSlug)
    .single();
    
  return data;
}
