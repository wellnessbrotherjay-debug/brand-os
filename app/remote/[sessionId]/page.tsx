'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { WorkoutSession, SessionEvent } from '@/lib/types/hotel-fitness';

interface RemotePageProps {
  params: { sessionId: string };
}

interface RemoteState {
  connected: boolean;
  currentExercise?: string;
  phase: 'prep' | 'work' | 'rest' | 'complete';
  timeLeft: number;
  canStart: boolean;
  canPause: boolean;
  canSkip: boolean;
  isRunning: boolean;
}

export default function RemotePage({ params }: RemotePageProps) {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [remoteState, setRemoteState] = useState<RemoteState>({
    connected: false,
    phase: 'prep',
    timeLeft: 30,
    canStart: true,
    canPause: false,
    canSkip: false,
    isRunning: false,
  });
  const [reps, setReps] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = useMemo(() => 
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []
  );

  // Fetch session data
  const fetchSessionData = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${params.sessionId}/state`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }

      setSession(data.session);
      setRemoteState(prev => ({
        ...prev,
        connected: true,
        phase: data.currentState.phase,
        timeLeft: data.currentState.timeLeft,
        isRunning: data.currentState.isRunning,
        canStart: data.session.status === 'ready' || data.session.status === 'paused',
        canPause: data.session.status === 'running',
        canSkip: data.session.status === 'running',
      }));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch session data:', err);
      setError('Failed to connect to workout session');
      setRemoteState(prev => ({ ...prev, connected: false }));
    }
  }, [params.sessionId]);

  // Initialize
  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`remote:${params.sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_events',
          filter: `session_id=eq.${params.sessionId}`,
        },
        (payload) => {
          const event = payload.new as SessionEvent;
          handleRealtimeEvent(event);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.sessionId, supabase]);

  // Handle realtime events
  const handleRealtimeEvent = useCallback((event: SessionEvent) => {
    switch (event.event) {
      case 'start':
        setRemoteState(prev => ({
          ...prev,
          isRunning: true,
          canStart: false,
          canPause: true,
          canSkip: true,
        }));
        break;
      case 'pause':
        setRemoteState(prev => ({
          ...prev,
          isRunning: false,
          canStart: true,
          canPause: false,
          canSkip: false,
        }));
        break;
      case 'resume':
        setRemoteState(prev => ({
          ...prev,
          isRunning: true,
          canStart: false,
          canPause: true,
          canSkip: true,
        }));
        break;
      case 'skip':
        // Refresh state from server
        fetchSessionData();
        break;
    }
  }, [fetchSessionData]);

  // Send event to server
  const sendEvent = useCallback(async (event: string, payload: any = {}) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions/${params.sessionId}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, payload }),
      });

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Failed to send event:', err);
      setError('Failed to send command');
    } finally {
      setIsLoading(false);
    }
  }, [params.sessionId, isLoading]);

  const phaseColor = {
    prep: '#00BFFF',
    work: '#FF4D4D', 
    rest: '#32CD32',
    complete: '#FFD100',
  }[remoteState.phase];

  const phaseLabel = {
    prep: 'Get Ready',
    work: 'WORK',
    rest: 'REST',
    complete: 'Complete',
  }[remoteState.phase];

  if (error && !remoteState.connected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">Connection Error</h1>
          <p className="text-lg opacity-70 mb-6">{error}</p>
          <button
            onClick={fetchSessionData}
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🏨 Hotel Fitness Remote</h1>
            <p className="text-sm opacity-70">
              {remoteState.connected ? '🟢 Connected' : '🔴 Disconnected'}
            </p>
          </div>
          
          {/* Status Indicator */}
          <div 
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ 
              backgroundColor: `${phaseColor}20`,
              color: phaseColor,
              border: `2px solid ${phaseColor}`,
            }}
          >
            {phaseLabel} • {remoteState.timeLeft}s
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Main Controls */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">🎮 Workout Controls</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => sendEvent('start')}
              disabled={!remoteState.canStart || isLoading}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 rounded-xl hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
            >
              ▶️ Start
            </button>
            
            <button
              onClick={() => sendEvent('pause')}
              disabled={!remoteState.canPause || isLoading}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-yellow-600 rounded-xl hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
            >
              ⏸️ Pause
            </button>
            
            <button
              onClick={() => sendEvent('resume')}
              disabled={!remoteState.canStart || remoteState.isRunning || isLoading}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 rounded-xl hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
            >
              ⏯️ Resume
            </button>
            
            <button
              onClick={() => sendEvent('skip')}
              disabled={!remoteState.canSkip || isLoading}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 rounded-xl hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
            >
              ⏭️ Skip
            </button>
          </div>
        </div>

        {/* Difficulty Adjustment */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">⚖️ Difficulty</h2>
          <p className="text-sm opacity-70 mb-4">
            Adjust the difficulty of the current exercise in real-time
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => sendEvent('easier', { exercise_slug: session?.template_slug })}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 rounded-xl hover:bg-green-700 disabled:bg-gray-600 transition-colors text-lg font-semibold"
            >
              📉 Too Hard
            </button>
            
            <button
              onClick={() => sendEvent('harder', { exercise_slug: session?.template_slug })}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-red-600 rounded-xl hover:bg-red-700 disabled:bg-gray-600 transition-colors text-lg font-semibold"
            >
              📈 Too Easy
            </button>
          </div>
          
          <div className="mt-4 text-xs opacity-60 text-center">
            Adjustments apply 20% changes to work/rest times and may suggest exercise variants
          </div>
        </div>

        {/* Rep Logging */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">📊 Rep Logging</h2>
          <p className="text-sm opacity-70 mb-4">
            Track your performance for this exercise
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Reps Completed</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg"
                placeholder="0"
                min="0"
                max="999"
              />
            </div>
            
            <button
              onClick={() => {
                sendEvent('rep_log', { reps, exercise: remoteState.currentExercise });
                setReps(0); // Reset after logging
              }}
              disabled={isLoading || reps <= 0}
              className="px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              💾 Save
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">⚡ Quick Actions</h2>
          
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => sendEvent('rep_log', { reps: 10, note: 'Quick log' })}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              ➕ Log 10 Reps
            </button>
            
            <button
              onClick={() => sendEvent('rep_log', { reps: 15, note: 'Quick log' })}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              ➕ Log 15 Reps
            </button>
            
            <button
              onClick={() => sendEvent('rep_log', { reps: 20, note: 'Quick log' })}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              ➕ Log 20 Reps
            </button>
          </div>
        </div>

        {/* Session Info */}
        {session && (
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">ℹ️ Session Info</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="opacity-70">Status:</span>
                <span className="capitalize font-medium">{session.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Template:</span>
                <span className="font-medium">{session.template_slug || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Block:</span>
                <span className="font-medium">{session.current_block + 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Exercise:</span>
                <span className="font-medium">{session.current_exercise + 1}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}