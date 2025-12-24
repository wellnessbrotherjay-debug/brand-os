import { NextRequest, NextResponse } from 'next/server';
import { CreateSessionSchema } from '@/lib/types/hotel-fitness';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await context.params;
  const supabase = createAdminClient();

  try {
    const body = await req.json();
    
    // Validate input
    const validatedData = CreateSessionSchema.parse({
      room_id: roomId,
      ...body,
    });

    // Check if room exists
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, name')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Create new workout session
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        room_id: roomId,
        user_id: validatedData.user_id,
        template_slug: validatedData.template_slug,
        status: 'idle',
        current_block: 0,
        current_exercise: 0,
        adaptations: {},
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create workout session' },
        { status: 500 }
      );
    }

    // Log session creation event
    const { error: eventError } = await supabase
      .from('session_events')
      .insert({
        session_id: session.id,
        event: 'session_created',
        payload: { room_name: room.name },
      });

    if (eventError) {
      console.error('Event logging error:', eventError);
      // Don't fail the request if event logging fails
    }

    return NextResponse.json({
      session,
      room,
      remote_url: `/remote/${session.id}`,
      player_url: `/room/${roomId}/player?sessionId=${session.id}`,
    });

  } catch (error) {
    console.error('Create session API error:', error);
    
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
