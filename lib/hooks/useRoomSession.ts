import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UseRoomSessionOptions {
  roomId: string;
}

export function useRoomSession({ roomId }: UseRoomSessionOptions) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const sessionIdRef = useRef<string | null>(null);

  const setSessionState = useCallback((nextSession: any) => {
    setSession(nextSession);
    sessionIdRef.current = nextSession?.id ?? null;
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        
        // Get active session for room
        const { data: sessionData, error: sessionError } = await supabase
          .from('workout_sessions')
          .select('*')
          .eq('room_id', roomId)
          .eq('status', 'active')
          .single();

        if (sessionError && sessionError.code !== 'PGRST116') {
          throw sessionError;
        }

        if (sessionData) {
          setSessionState(sessionData);
          
          // Get session events
          const { data: eventsData } = await supabase
            .from('session_events')
            .select('*')
            .eq('session_id', sessionData.id)
            .order('created_at', { ascending: true });
            
          setEvents(eventsData || []);
        }

      } catch (err) {
        console.error('Error loading session:', err);
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // Subscribe to session changes
    const channel = supabase.channel(`room-${roomId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'workout_sessions', filter: `room_id=eq.${roomId}` },
        payload => {
          if (payload.new) {
            setSessionState(payload.new);
          }
        })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_events' },
        payload => {
          if (payload.new && payload.new.session_id === sessionIdRef.current) {
            setEvents(prev => [...prev, payload.new]);
          }
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, setSessionState]);

  const updateSessionDifficulty = async (direction: 'easier' | 'harder') => {
    if (!session) return;

    const currentLevel = session.difficulty_level;
    const levels = ['easy', 'medium', 'hard'];
    const currentIndex = levels.indexOf(currentLevel);
    
    let newLevel = currentLevel;
    if (direction === 'easier' && currentIndex > 0) {
      newLevel = levels[currentIndex - 1];
    } else if (direction === 'harder' && currentIndex < levels.length - 1) {
      newLevel = levels[currentIndex + 1];
    }

    try {
      // Update session difficulty
      const { error: sessionError } = await supabase
        .from('workout_sessions')
        .update({ difficulty_level: newLevel })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      // Log difficulty change event
      const { error: eventError } = await supabase
        .from('session_events')
        .insert({
          session_id: session.id,
          type: 'difficulty_change',
          data: { from: currentLevel, to: newLevel }
        });

      if (eventError) throw eventError;

    } catch (err) {
      console.error('Error updating difficulty:', err);
      setError(err instanceof Error ? err.message : 'Failed to update difficulty');
    }
  };

  const endSession = async () => {
    if (!session) return;

    try {
      const { error: sessionError } = await supabase
        .from('workout_sessions')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      // Clear room's active session
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ active_session_id: null })
        .eq('id', roomId);

      if (roomError) throw roomError;

      setSessionState(null);
      setEvents([]);

    } catch (err) {
      console.error('Error ending session:', err);
      setError(err instanceof Error ? err.message : 'Failed to end session');
    }
  };

  return {
    loading,
    error,
    session,
    events,
    updateSessionDifficulty,
    endSession
  };
}
