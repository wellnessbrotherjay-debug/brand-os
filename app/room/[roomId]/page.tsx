"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import Image from "next/image";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type DifficultyLevel = "easy" | "medium" | "hard";

interface Room {
  id: string;
  name: string;
  type: string;
  active_session_id: string | null;
}

interface WorkoutSession {
  id: string;
  room_id: string;
  status: "waiting" | "active" | "paused" | "completed" | "testing" | "done" | "ready" | "running" | "idle";
  difficulty_level: DifficultyLevel;
  created_at: string;
}

interface SessionEvent {
  id: string;
  session_id: string;
  event: string;
  payload: Record<string, any> | null;
  ts: string;
}

const difficultyOrder: DifficultyLevel[] = ["easy", "medium", "hard"];

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const roomId = params.roomId;

  const [room, setRoom] = useState<Room | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSessionEvents = useCallback(async (sessionId: string) => {
    const { data, error } = await supabase
      .from("session_events")
      .select("*")
      .eq("session_id", sessionId)
      .order("ts", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error loading session events:", error);
      return;
    }

    setEvents((data ?? []) as SessionEvent[]);
  }, []);

  useEffect(() => {
    if (!session?.id) {
      setQrCodeUrl("");
      return;
    }

    const remoteUrl = `${window.location.origin}/remote/${session.id}`;
    QRCode.toDataURL(remoteUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then(setQrCodeUrl)
      .catch((err) => console.error("Failed to generate QR code:", err));
  }, [session]);

  useEffect(() => {
    if (!roomId) return;

    const loadRoomData = async () => {
      try {
        setLoading(true);

        const { data: roomData, error: roomError } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", roomId)
          .single();

        if (roomError) throw roomError;
        setRoom(roomData as Room);

        if (roomData.active_session_id) {
          const { data: sessionData, error: sessionError } = await supabase
            .from("workout_sessions")
            .select("*")
            .eq("id", roomData.active_session_id)
            .single();

          if (sessionError) throw sessionError;
          setSession(sessionData as WorkoutSession);
          await fetchSessionEvents(sessionData.id);
        } else {
          setSession(null);
          setEvents([]);
        }
      } catch (err) {
        console.error("Error loading room data:", err);
        setError("Failed to load room information");
      } finally {
        setLoading(false);
      }
    };

    loadRoomData();
  }, [roomId, fetchSessionEvents]);

  const startNewSession = async () => {
    if (!roomId) return;

    try {
      setActionLoading(true);

      const { data: newSession, error: sessionError } = await supabase
        .from("workout_sessions")
        .insert({
          room_id: roomId,
          status: "testing",
          difficulty_level: "medium",
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { error: roomUpdateError } = await supabase
        .from("rooms")
        .update({ active_session_id: newSession.id })
        .eq("id", roomId);

      if (roomUpdateError) throw roomUpdateError;

      setSession(newSession as WorkoutSession);
      setEvents([]);

      router.push(`/test?sessionId=${newSession.id}&roomId=${roomId}`);
    } catch (err) {
      console.error("Error creating session:", err);
      setError("Failed to start workout session");
    } finally {
      setActionLoading(false);
    }
  };

  const goToPlayer = () => {
    router.push(`/room/${roomId}/player`);
  };

  const handleEndSession = async () => {
    if (!session || !roomId) return;

    try {
      setActionLoading(true);

      const { error: sessionError } = await supabase
        .from("workout_sessions")
        .update({
          status: "completed",
          ended_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      if (sessionError) throw sessionError;

      const { error: roomError } = await supabase
        .from("rooms")
        .update({ active_session_id: null })
        .eq("id", roomId);

      if (roomError) throw roomError;

      setSession(null);
      setRoom((prev) => (prev ? { ...prev, active_session_id: null } : prev));
      setEvents([]);
    } catch (err) {
      console.error("Error ending session:", err);
      setError("Failed to end workout session");
    } finally {
      setActionLoading(false);
    }
  };

  const updateSessionDifficulty = async (direction: "easier" | "harder") => {
    if (!session) return;

    const currentIndex = difficultyOrder.indexOf(session.difficulty_level);
    const targetIndex =
      direction === "easier"
        ? Math.max(0, currentIndex - 1)
        : Math.min(difficultyOrder.length - 1, currentIndex + 1);

    const nextLevel = difficultyOrder[targetIndex];
    if (nextLevel === session.difficulty_level) return;

    const previousLevel = session.difficulty_level;

    try {
      setActionLoading(true);

      const { data, error } = await supabase
        .from("workout_sessions")
        .update({ difficulty_level: nextLevel })
        .eq("id", session.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setSession(data as WorkoutSession);
      }

      await supabase.from("session_events").insert({
        session_id: session.id,
        event: "difficulty_change",
        payload: {
          from: previousLevel,
          to: nextLevel,
        },
      });

      await fetchSessionEvents(session.id);
    } catch (err) {
      console.error("Error updating difficulty:", err);
      setError("Failed to update session difficulty");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">
            {room?.name || `Room ${roomId}`}
          </h1>
          <p className="text-xl text-blue-300">Hotel Fitness System</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                loading ? "bg-yellow-500" : "bg-green-500"
              } animate-pulse`}
            ></div>
            <span className="text-sm text-gray-400">
              {loading ? "Syncing..." : "Connected"}
            </span>
          </div>
        </div>

        {session ? (
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center">
                <h2 className="text-2xl font-bold mb-6">
                  Mobile Remote Control
                </h2>

                {qrCodeUrl && (
                  <div className="bg-white p-4 rounded-xl inline-block mb-6">
                    <Image
                      src={qrCodeUrl}
                      alt="QR Code for mobile remote"
                      width={200}
                      height={200}
                    />
                  </div>
                )}

                <p className="text-sm text-gray-300 mb-4">
                  Scan with your phone to control the workout
                </p>

                <div className="space-y-4">
                  <div className="bg-blue-500/20 rounded-lg p-4">
                    <p className="text-xs text-blue-300">Session ID: {session.id}</p>
                    <p className="text-xs text-blue-300">
                      Status: {session.status}
                    </p>
                    <p className="text-xs text-blue-300">
                      Difficulty: {session.difficulty_level}
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">
                      Recent Events
                    </h3>
                    <div className="space-y-2">
                      {events.slice(0, 5).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs border-l-2 border-blue-500 pl-2"
                        >
                          <p className="text-gray-400">
                            {new Date(event.ts).toLocaleTimeString()}
                          </p>
                          <p className="text-white">
                            {event.event === "difficulty_change" &&
                            event.payload
                              ? `Difficulty changed: ${event.payload.from} → ${event.payload.to}`
                              : event.event.replace("_", " ")}
                          </p>
                        </div>
                      ))}
                      {events.length === 0 && (
                        <p className="text-xs text-gray-500">
                          No recent events recorded.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-6">Workout Controls</h2>

                <div className="space-y-4">
                  <button
                    onClick={goToPlayer}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-colors"
                  >
                    🎬 Start TV Player
                  </button>

                  <button
                    onClick={() => router.push(`/remote/${session.id}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-colors"
                  >
                    📱 Open Phone Remote
                  </button>

                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">
                      Workout Difficulty
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateSessionDifficulty("easier")}
                        disabled={
                          session.difficulty_level === "easy" || actionLoading
                        }
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                      >
                        👇 Make Easier
                      </button>
                      <button
                        onClick={() => updateSessionDifficulty("harder")}
                        disabled={
                          session.difficulty_level === "hard" || actionLoading
                        }
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                      >
                        👆 Make Harder
                      </button>
                    </div>
                    <div className="mt-2 flex justify-center items-center gap-2">
                      <span className="text-xs text-gray-400">
                        Current Level:
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          session.difficulty_level === "easy"
                            ? "text-yellow-400"
                            : session.difficulty_level === "medium"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {session.difficulty_level.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleEndSession}
                    disabled={actionLoading}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-4 px-6 rounded-xl transition-colors"
                  >
                    🛑 End Session
                  </button>
                </div>

                <div className="mt-6 p-4 bg-yellow-500/20 rounded-lg">
                  <h3 className="font-bold text-yellow-300 mb-2">Instructions:</h3>
                    <ol className="text-sm text-yellow-100 space-y-1">
                      <li>1. Scan QR code with your phone</li>
                      <li>2. Click &quot;Start TV Player&quot; for the big screen</li>
                      <li>3. Use your phone to control the workout</li>
                      <li>4. Follow along on the TV display</li>
                    </ol>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-12">
              <h2 className="text-3xl font-bold mb-6">
                Ready for Your Workout?
              </h2>

              <p className="text-xl text-gray-300 mb-8">
                Start a new fitness session in {room?.name || `Room ${roomId}`}
              </p>

              <button
                onClick={startNewSession}
                disabled={actionLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all transform hover:scale-105"
              >
                🏋️ Start New Workout Session
              </button>

              <div className="mt-8 p-6 bg-blue-500/20 rounded-xl">
                <h3 className="font-bold text-blue-300 mb-4">
                  What happens next:
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl mb-2">📱</div>
                    <p>Get QR code for phone control</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-2">📺</div>
                    <p>Launch TV player interface</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-2">💪</div>
                    <p>Start your personalized workout</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
