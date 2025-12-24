"use client";

import { useEffect, useMemo, useState } from "react";
import { useBranding } from "@/lib/hooks/useBranding";
import BrandScreen from "@/components/BrandScreen";
import { supabase } from "@/lib/supabase";

type WorkoutSession = {
  id: string;
  room_id: string | null;
  status: string;
  template_slug: string | null;
  started_at: string | null;
};

type HRSummary = {
  id: string;
  user_id: string | null;
  avg_hr: number | null;
  max_hr: number | null;
  created_at: string | null;
};

type Template = {
  id: string;
  title: string;
  level: string;
  duration_min: number;
};

export default function RoomActivePage() {
  const { brand, ready } = useBranding();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [hrStats, setHrStats] = useState<HRSummary[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: sessionsData }, { data: hrData }, { data: templateData }] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("id, room_id, status, template_slug, started_at")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("hr_sessions")
          .select("id, user_id, avg_hr, max_hr, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("workout_templates").select("id, title, level, duration_min").limit(20),
      ]);

      setSessions(sessionsData ?? []);
      setHrStats(hrData ?? []);
      setTemplates(templateData ?? []);
      setLoading(false);
    };
    load().catch((error) => console.warn("Failed to load /room-active data", error));
  }, []);

  useEffect(() => {
    if (!selectedTemplate && templates.length) {
      setSelectedTemplate(templates[0].id);
    }
  }, [templates, selectedTemplate]);

  const activeTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplate),
    [templates, selectedTemplate]
  );

  if (!ready) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading…</div>;
  }

  return (
    <BrandScreen
      eyebrow="Live Workout Control"
      title="Room Activity & HR Monitor"
      description="Monitor sessions, deploy workouts, and review HRM telemetry in real time."
      backHref="/home"
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-black/35 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Templates</h2>
              <p className="text-xs text-slate-400">Select a program to deploy to active rooms.</p>
            </div>
            <select
              value={selectedTemplate}
              onChange={(event) => setSelectedTemplate(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm outline-none"
            >
              <option value="">Choose template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title} · {template.level}
                </option>
              ))}
            </select>
          </div>
          {selectedTemplate && activeTemplate && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200">
              <p className="font-semibold">{activeTemplate.title}</p>
              <p>
                Level {activeTemplate.level} · {activeTemplate.duration_min} min
              </p>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/35 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Sessions</h2>
            {loading && <span className="text-xs uppercase tracking-[0.35em] text-slate-400">Loading…</span>}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(sessions.length ? sessions : DEFAULT_SESSIONS).map((session) => (
              <div key={session.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-sm font-semibold">Room {session.room_id ?? "Unknown"}</p>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                  Template: {session.template_slug ?? "custom"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Started: {session.started_at ? new Date(session.started_at).toLocaleTimeString() : "—"}
                </p>
                <p className="text-xs" style={{ color: brand.accent }}>
                  Status: {session.status}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/35 p-6">
          <h2 className="text-lg font-semibold">Heart Rate Monitors</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(hrStats.length ? hrStats : DEFAULT_HR).map((stat) => (
              <div key={stat.id} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
                <p className="font-semibold">Guest {stat.user_id?.slice(0, 8) ?? "Anon"}</p>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                  Avg {stat.avg_hr ?? 0} bpm · Max {stat.max_hr ?? 0} bpm
                </p>
                <p className="text-xs text-slate-400">
                  Updated {stat.created_at ? new Date(stat.created_at).toLocaleTimeString() : "—"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </BrandScreen>
  );
}

const DEFAULT_SESSIONS: WorkoutSession[] = [
  { id: "fallback-1", room_id: "1901", status: "ready", template_slug: "sunrise-reset", started_at: null },
  { id: "fallback-2", room_id: "1902", status: "running", template_slug: "glute-lab", started_at: null },
];

const DEFAULT_HR: HRSummary[] = [
  { id: "hr-1", user_id: "Guest A", avg_hr: 88, max_hr: 132, created_at: null },
  { id: "hr-2", user_id: "Guest B", avg_hr: 76, max_hr: 118, created_at: null },
];
