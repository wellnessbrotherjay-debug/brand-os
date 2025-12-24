"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DEFAULT_BRAND, type BrandSettings, useBranding } from "@/lib/hooks/useBranding";

const FONT_CHOICES: Array<{ label: string; value: string }> = [
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
];

export default function BrandingConsole() {
  const { brand, ready, saveBrand, resetBrand } = useBranding();
  const [draft, setDraft] = useState<BrandSettings>(brand);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(brand);
  }, [brand]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center bg-black text-white">Loading branding…</div>;
  }

  const handleSave = async () => {
    setSaving(true);
    await saveBrand(draft);
    setSaving(false);
  };

  const handleReset = async () => {
    setSaving(true);
    await resetBrand();
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Brand Console</p>
          <h1 className="text-3xl font-semibold">HotelFit / GLVT Theme Builder</h1>
          <p className="text-sm text-slate-400">
            Sync logo, colors, and media to Supabase so every welcome screen, workout display, and builder view stay
            perfectly on-brand.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Logo URL
              <input
                type="url"
                value={draft.logoUrl}
                onChange={(event) => setDraft((prev) => ({ ...prev, logoUrl: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Background image URL
              <input
                type="url"
                value={draft.backgroundUrl}
                onChange={(event) => setDraft((prev) => ({ ...prev, backgroundUrl: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
              />
            </label>

            <label className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Ambient video URL
              <input
                type="url"
                value={draft.videoUrl ?? ""}
                onChange={(event) => setDraft((prev) => ({ ...prev, videoUrl: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
              />
            </label>

            <label className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Font
              <select
                value={draft.font}
                onChange={(event) => setDraft((prev) => ({ ...prev, font: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
              >
                {FONT_CHOICES.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>

            <ColorInput label="Primary color" value={draft.primary} onChange={(value) => setDraft((prev) => ({ ...prev, primary: value }))} />
            <ColorInput label="Secondary color" value={draft.secondary} onChange={(value) => setDraft((prev) => ({ ...prev, secondary: value }))} />
            <ColorInput label="Accent color" value={draft.accent} onChange={(value) => setDraft((prev) => ({ ...prev, accent: value }))} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-2xl bg-emerald-400/90 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-black transition hover:bg-emerald-300 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save theme"}
            </button>
            <button
              onClick={handleReset}
              disabled={saving}
              className="rounded-2xl border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.35em] text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            >
              Reset to default
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-300">Live preview</p>
          <motion.div
            className="mt-4 rounded-[40px] border border-white/10 bg-cover bg-center p-6"
            style={{ backgroundImage: `url(${draft.backgroundUrl})` }}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
          >
            <div className="rounded-[32px] border border-white/20 bg-black/60 p-6" style={{ fontFamily: draft.font }}>
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={draft.logoUrl}
                  alt="brand logo"
                  className="h-14 w-14 rounded-full border border-white/20 bg-white/5 object-contain"
                  onError={(event) => {
                    (event.target as HTMLImageElement).style.opacity = "0.2";
                  }}
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/70">{draft.name}</p>
                  <h2 className="text-2xl font-semibold" style={{ color: draft.accent }}>
                    TV Welcome Preview
                  </h2>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {["Facilities", "Workouts", "Menu", "Services"].map((label) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 p-4 text-sm font-semibold"
                    style={{ background: `linear-gradient(135deg, ${draft.primary}, ${draft.secondary})` }}
                  >
                    {label} →
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs uppercase tracking-[0.35em] text-slate-500">
      {label}
      <div className="mt-2 flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-20 rounded-2xl border border-white/10 bg-black/40"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
        />
      </div>
    </label>
  );
}
