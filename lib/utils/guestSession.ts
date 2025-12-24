import { supabase } from "@/lib/supabase";

const GUEST_SESSION_KEY = "guest_session_id";

export async function ensureGuestSession(roomHint?: string) {
  if (typeof window === "undefined") return null;

  const cached = window.localStorage.getItem(GUEST_SESSION_KEY);
  if (cached) return cached;

  const roomNumber = roomHint ?? window.localStorage.getItem("room_number") ?? "Suite-000";

  const { data, error } = await supabase
    .from("guest_sessions")
    .insert({ room_number: roomNumber })
    .select("id")
    .single();

  if (error) {
    console.warn("Failed to create guest session", error);
    return null;
  }

  if (data?.id) {
    window.localStorage.setItem(GUEST_SESSION_KEY, data.id);
    return data.id;
  }

  return null;
}
