'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Orbitron } from 'next/font/google';
import { WorkoutSession, WorkoutTemplate, SessionEvent, Exercise } from '@/lib/types/hotel-fitness';
import { Stream } from '@cloudflare/stream-react';

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-orbitron',
});

interface PlayerProps {
  sessionId: string;
  roomId: string;
}

interface WorkoutState {
  phase: 'prep' | 'work' | 'rest' | 'complete';
  timeLeft: number;
  currentBlock: number;
  currentExercise: number;
  isRunning: boolean;
  adaptations: Record<string, number>;
}

export default function Player({ sessionId, roomId }: PlayerProps) {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [workoutState, setWorkoutState] = useState<WorkoutState>({
    phase: 'prep',
    timeLeft: 30,
    currentBlock: 0,
    currentExercise: 0,
    isRunning: false,
    adaptations: {},
  });
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() =>
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []
  );

  // Fetch session data
  const fetchSessionData = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/state`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setSession(data.session);
      setTemplate(data.template);
      setWorkoutState(data.currentState);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch session data:', err);
      setError('Failed to load workout session');
    }
  }, [sessionId]);

  // Fetch exercises
  const fetchExercises = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (err) {
      console.error('Failed to fetch exercises:', err);
    }
  }, [supabase]);

  // Initialize data
  useEffect(() => {
    fetchSessionData();
    fetchExercises();
  }, [fetchSessionData, fetchExercises]);

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_events',
          filter: `session_id=eq.${sessionId}`,
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
  }, [sessionId, supabase, handleRealtimeEvent]);

  // Handle realtime events
  const handleRealtimeEvent = useCallback((event: SessionEvent) => {
    switch (event.event) {
      case 'start':
        setWorkoutState(prev => ({ ...prev, isRunning: true, phase: 'work' }));
        break;
      case 'pause':
        setWorkoutState(prev => ({ ...prev, isRunning: false }));
        break;
      case 'resume':
        setWorkoutState(prev => ({ ...prev, isRunning: true }));
        break;
      case 'skip':
        // Refresh state from server
        fetchSessionData();
        break;
      case 'easier':
      case 'harder':
        if (event.payload.exercise_slug) {
          setWorkoutState(prev => ({
            ...prev,
            adaptations: {
              ...prev.adaptations,
              [event.payload.exercise_slug]: prev.adaptations[event.payload.exercise_slug] || 0 +
                (event.event === 'harder' ? 0.5 : -0.5),
            },
          }));
        }
        break;
    }
  }, [fetchSessionData]);

  // Get current exercise
  const currentExerciseData = useMemo(() => {
    if (!template?.blocks || !template.blocks[workoutState.currentBlock]) {
      return null;
    }

    const currentBlock = template.blocks[workoutState.currentBlock];
    const exerciseSlug = currentBlock[workoutState.currentExercise]?.slug;

    if (!exerciseSlug) return null;

    const exerciseDetail = exercises.find(ex => ex.slug === exerciseSlug);
    const blockExercise = currentBlock[workoutState.currentExercise];

    return {
      ...exerciseDetail,
      ...blockExercise,
    };
  }, [template, workoutState, exercises]);

  // Get next exercise
  const nextExerciseData = useMemo(() => {
    if (!template?.blocks) return null;

    const currentBlock = template.blocks[workoutState.currentBlock];
    let nextExerciseSlug: string | null = null;

    // Check if there's another exercise in current block
    if (currentBlock && workoutState.currentExercise + 1 < currentBlock.length) {
      nextExerciseSlug = currentBlock[workoutState.currentExercise + 1].slug;
    }
    // Check if there's a next block
    else if (template.blocks[workoutState.currentBlock + 1]) {
      const nextBlock = template.blocks[workoutState.currentBlock + 1];
      nextExerciseSlug = nextBlock[0]?.slug;
    }

    if (!nextExerciseSlug) return null;

    return exercises.find(ex => ex.slug === nextExerciseSlug);
  }, [template, workoutState, exercises]);

  const getWorkTime = useCallback(() => {
    if (!currentExerciseData) return 40;
    const adaptation = workoutState.adaptations[currentExerciseData.slug] || 0;
    return Math.max(10, Math.round((currentExerciseData.work_s || 40) * (1 + adaptation * 0.2)));
  }, [currentExerciseData, workoutState.adaptations]);

  const getRestTime = useCallback(() => {
    if (!currentExerciseData) return 20;
    const adaptation = workoutState.adaptations[currentExerciseData.slug] || 0;
    return Math.max(5, Math.round((currentExerciseData.rest_s || 20) * (1 - adaptation * 0.1)));
  }, [currentExerciseData, workoutState.adaptations]);

  // Timer countdown
  useEffect(() => {
    if (!workoutState.isRunning) return;

    const interval = setInterval(() => {
      setWorkoutState(prev => {
        if (prev.timeLeft <= 1) {
          // Phase transition
          if (prev.phase === 'work') {
            return { ...prev, phase: 'rest', timeLeft: getRestTime() };
          } else if (prev.phase === 'rest') {
            return { ...prev, phase: 'work', timeLeft: getWorkTime() };
          }
          return prev;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [workoutState.isRunning, getRestTime, getWorkTime]);

  const phaseColor = {
    prep: '#00BFFF',
    work: '#FF4D4D',
    rest: '#32CD32',
    complete: '#FFD100',
  }[workoutState.phase];

  const phaseLabel = {
    prep: 'Get Ready',
    work: 'WORK',
    rest: 'REST',
    complete: 'Complete',
  }[workoutState.phase];

  if (error) {
    return (
      <div className="w-screen h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Error</h1>
          <p className="text-xl opacity-70">{error}</p>
        </div>
      </div>
    );
  }

  if (!session || !template) {
    return (
      <div className="w-screen h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl">Loading workout...</p>
        </div>
      </div>
    );
  }

  return (
    <main className={`${orbitron.variable} ${orbitron.className} w-screen h-screen bg-black text-white grid grid-cols-3 gap-6 p-6`}>

      {/* Left Side - Current Exercise (2/3 width) */}
      <div className="col-span-2 flex flex-col">

        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-blue-400">🏨 Hotel Fitness</div>
            <div className="text-lg opacity-70">Room {roomId}</div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm opacity-70">Block {workoutState.currentBlock + 1}/{template.blocks.length}</div>
              <div className="text-lg font-semibold">{template.title}</div>
            </div>

            {/* Timer */}
            <div
              className="flex flex-col items-center gap-2 rounded-2xl border-2 px-6 py-4 text-center backdrop-blur-md"
              style={{
                borderColor: phaseColor,
                backgroundColor: `${phaseColor}20`,
                boxShadow: `0 0 30px ${phaseColor}40`,
              }}
            >
              <div className="text-sm uppercase tracking-wider" style={{ color: phaseColor }}>
                {phaseLabel}
              </div>
              <div
                className="text-4xl font-black"
                style={{
                  color: phaseColor,
                  textShadow: `0 0 20px ${phaseColor}80`,
                }}
              >
                {workoutState.timeLeft}s
              </div>
            </div>
          </div>
        </header>

        {/* Main Video */}
        <div className="flex-1 relative rounded-3xl overflow-hidden border-4 border-blue-500">
          {/* Cloudflare Stream Integration */}
          {(currentExerciseData?.demo_url?.includes('cloudflarestream.com') || currentExerciseData?.demo_url?.length === 32) ? (
            <Stream
              src={currentExerciseData.demo_url}
              autoplay
              loop
              muted
              controls={false}
              responsive={false}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={currentExerciseData?.demo_url || '/videos/public/placeholder.mp4'}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Video failed to load:', currentExerciseData?.demo_url);
              }}
            />
          )}

          {/* Video Overlay Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
            <h1 className="text-4xl font-black uppercase mb-2">
              {currentExerciseData?.name || 'Loading Exercise...'}
            </h1>
            {currentExerciseData?.cues && (
              <p className="text-lg opacity-90 leading-relaxed text-blue-300">
                {currentExerciseData.cues}
              </p>
            )}

            {/* Adaptation Indicator */}
            {workoutState.adaptations[currentExerciseData?.slug || ''] && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm opacity-70">Difficulty:</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => {
                    const adaptationLevel = workoutState.adaptations[currentExerciseData?.slug || ''] || 0;
                    const isActive = Math.abs(adaptationLevel) > i * 0.5;
                    const isHarder = adaptationLevel > 0;
                    return (
                      <div
                        key={i}
                        className={`w-2 h-6 rounded ${isActive
                          ? (isHarder ? 'bg-red-500' : 'bg-green-500')
                          : 'bg-gray-600'
                          }`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Up Next & Instructions (1/3 width) */}
      <div className="col-span-1 flex flex-col gap-6">

        {/* Up Next */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-blue-400">⬆️ Up Next</h2>

          {nextExerciseData ? (
            <>
              <div className="relative rounded-xl overflow-hidden mb-4 border-2 border-gray-600">
                {(nextExerciseData.demo_url?.includes('cloudflarestream.com') || nextExerciseData.demo_url?.length === 32) ? (
                  <Stream
                    src={nextExerciseData.demo_url}
                    autoplay
                    loop
                    muted
                    controls={false}
                    responsive={false}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <video
                    src={nextExerciseData.demo_url || '/videos/public/placeholder.mp4'}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-40 object-cover"
                  />
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">{nextExerciseData.name}</h3>
              {nextExerciseData.cues && (
                <p className="text-sm opacity-80 leading-relaxed">{nextExerciseData.cues}</p>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-lg font-semibold">Workout Complete!</p>
              <p className="text-sm opacity-70">Great job finishing your session</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-green-400">📱 Remote Control</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Use your phone to start, pause, or skip exercises</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>Tap &quot;Too Hard&quot; or &quot;Too Easy&quot; to adjust difficulty</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Log your reps for tracking progress</span>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="mt-6 p-4 bg-white rounded-xl">
            <div className="w-full h-24 bg-gray-900 rounded flex items-center justify-center text-white text-xs">
              QR: /remote/{sessionId}
            </div>
          </div>
        </div>

        {/* Workout Progress */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-purple-400">📊 Progress</h2>

          {/* Block Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Block Progress</span>
              <span>{workoutState.currentBlock + 1}/{template.blocks.length}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((workoutState.currentBlock + 1) / template.blocks.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Exercise Progress */}
          {template.blocks[workoutState.currentBlock] && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Exercise Progress</span>
                <span>{workoutState.currentExercise + 1}/{template.blocks[workoutState.currentBlock].length}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${((workoutState.currentExercise + 1) / template.blocks[workoutState.currentBlock].length) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
