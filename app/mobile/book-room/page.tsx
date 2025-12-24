"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type RoomOption = {
  id: string;
  name: string | null;
  qr_slug?: string | null;
};

type FormState = {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  packageName: string;
  partySize: number;
  specialRequests: string;
};

const formatDateInput = (date: Date) => date.toISOString().split("T")[0];

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
};

export default function BookRoomPage() {
  const today = useMemo(() => formatDateInput(new Date()), []);
  const defaultCheckout = useMemo(() => formatDateInput(tomorrow()), []);

  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [form, setForm] = useState<FormState>(() => ({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    roomId: "",
    checkIn: today,
    checkOut: defaultCheckout,
    packageName: "Mind & Body Retreat",
    partySize: 1,
    specialRequests: "",
  }));

  useEffect(() => {
    let mounted = true;
    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const user = data.session?.user ?? null;
      setAuthUser(user);
      setAuthLoading(false);
      if (user) {
        setForm((prev) => ({
          ...prev,
          guestName: prev.guestName || (user.user_metadata?.full_name as string | undefined) || "",
          guestEmail: prev.guestEmail || user.email || "",
        }));
      }
    };
    syncSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      if (!mounted) return;
      setAuthUser(user);
      if (user) {
        setForm((prev) => ({
          ...prev,
          guestName: prev.guestName || (user.user_metadata?.full_name as string | undefined) || "",
          guestEmail: prev.guestEmail || user.email || "",
        }));
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadRooms = async () => {
      setRoomsLoading(true);
      try {
        const res = await fetch("/api/rooms");
        if (!res.ok) throw new Error("Failed to fetch rooms");
        const json = await res.json();
        setRooms(json.rooms ?? []);
      } catch (error) {
        console.warn("[book-room] rooms", error);
        setStatus("Unable to load rooms. Try again later.");
      } finally {
        setRoomsLoading(false);
      }
    };
    loadRooms();
  }, []);

  const handleChange = (field: keyof FormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) {
      setStatus("Please sign in with a magic link before booking.");
      return;
    }
    if (!form.roomId) {
      setStatus("Select a room first.");
      return;
    }
    setSubmitting(true);
    setStatus("Booking room…");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authUser.id,
          roomId: form.roomId,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          guestName: form.guestName || "Hotel Guest",
          guestEmail: form.guestEmail || undefined,
          guestPhone: form.guestPhone || undefined,
          packageName: form.packageName || undefined,
          partySize: form.partySize || undefined,
          specialRequests: form.specialRequests || undefined,
          source: "mobile",
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload?.error ?? "Booking failed");
        return;
      }
      setStatus("Booking confirmed!");
    } catch (error) {
      console.error("[book-room] submit", error);
      setStatus("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-6 text-center text-sm text-slate-400">
        Loading your session…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <header>
          <Link href="/mobile" className="text-xs uppercase tracking-[0.4em] text-emerald-300">
            ← Back to mobile home
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">Book a Room</h1>
          <p className="text-sm text-slate-400">
            Create a booking from your phone and it will show up instantly on the in-room TV, gym sessions,
            and concierge dashboards. You&apos;re already signed in via magic link, so we&apos;ll attach the stay to
            your profile automatically.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-white/5 bg-slate-900/60 p-5">
          {authUser ? (
            <div className="rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3 text-sm text-slate-100">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Booking for</p>
              <p className="text-white">{authUser.email ?? authUser.user_metadata?.full_name ?? authUser.id}</p>
              <p className="break-all text-[11px] text-slate-500">{authUser.id}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              You&apos;re not signed in. Go back to the mobile home, request a magic link, and open it on this device to
              continue.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Guest name" required>
              <input
                type="text"
                value={form.guestName}
                onChange={(event) => handleChange("guestName", event.target.value)}
                className="w-full rounded-2xl bg-slate-800/60 px-4 py-3 text-sm outline-none"
              />
            </Field>
            <Field label="Guest email">
              <input
                type="email"
                value={form.guestEmail}
                onChange={(event) => handleChange("guestEmail", event.target.value)}
                className="w-full rounded-2xl bg-slate-800/60 px-4 py-3 text-sm outline-none"
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Guest phone">
              <input
                type="tel"
                value={form.guestPhone}
                onChange={(event) => handleChange("guestPhone", event.target.value)}
                className="w-full rounded-2xl bg-slate-800/60 px-4 py-3 text-sm outline-none"
              />
            </Field>
            <Field label="Package name">
              <input
                type="text"
                value={form.packageName}
                onChange={(event) => handleChange("packageName", event.target.value)}
                className="w-full rounded-2xl bg-slate-800/60 px-4 py-3 text-sm outline-none"
              />
            </Field>
          </div>

          <Field label="Room" required>
            <select
              value={form.roomId}
              onChange={(event) => handleChange("roomId", event.target.value)}
              className="w-full rounded-2xl bg-slate-800/60 px-4 py-3 text-sm outline-none"
              disabled={roomsLoading}
            >
              <option value="">{roomsLoading ? "Loading rooms…" : "Select a room"}</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name ?? room.qr_slug ?? room.id}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Check-in" required>
              <input
                type="date"
                min={today}
                value={form.checkIn}
                onChange={(event) => handleChange("checkIn", event.target.value)}
                className="w-full rounded-2xl bg-slate-800/60 px-4 py-3 text-sm outline-none"
              />
            </Field>
            <Field label="Check-out" required>
              <input
                type="date"
                min={form.checkIn}
                value={form.checkOut}
                onChange={(event) => handleChange("checkOut", event.target.value)}
                className="w-full rounded-2xl bg-slate-800/60 px-4 py-3 text-sm outline-none"
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Party size">
              <input
                type="number"
                min={1}
                max={6}
                value={form.partySize}
                onChange={(event) => handleChange("partySize", Number(event.target.value))}
                className="w-full rounded-2xl bg-slate-800/60 px-4 py-3 text-sm outline-none"
              />
            </Field>
            <Field label="Special requests">
              <input
                type="text"
                value={form.specialRequests}
                onChange={(event) => handleChange("specialRequests", event.target.value)}
                className="w-full rounded-2xl bg-slate-800/60 px-4 py-3 text-sm outline-none"
                placeholder="Late checkout, contrast therapy, etc."
              />
            </Field>
          </div>

          {status && (
            <div className="rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3 text-sm text-slate-200">
              {status}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !authUser}
            className="w-full rounded-2xl bg-emerald-500/90 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {!authUser ? "Sign in to book" : submitting ? "Submitting…" : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
};

function Field({ label, hint, required, children }: FieldProps) {
  return (
    <label className="block text-sm">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-400">
        <span>
          {label}
          {required ? " *" : ""}
        </span>
        {hint && <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
