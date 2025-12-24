"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/MainLayout";
import { NexusCard } from "@/components/ui/NexusCard";

export default function FinanceSuiteEmbed() {
  const [ready, setReady] = useState(false);
  const hasLiveKeys = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const [mode, setMode] = useState<"demo" | "live">(hasLiveKeys ? "live" : "demo");

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <MainLayout title="Finance Suite" subtitle="Admin">
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
            {mode === "live" ? "Live Mode" : "Demo Mode"}
          </span>
          {!hasLiveKeys && (
            <span className="text-xs text-amber-200/90">
              Live mode will unlock automatically when Supabase keys are configured.
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode("demo")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              mode === "demo"
                ? "bg-white/10 text-white border border-white/30"
                : "text-slate-200 border border-transparent hover:bg-white/5"
            }`}
          >
            Demo
          </button>
          <button
            onClick={() => hasLiveKeys && setMode("live")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              mode === "live"
                ? "bg-gradient-to-r from-cyan-500/70 to-emerald-400/70 text-slate-900 border border-cyan-300/60 shadow-[0_10px_30px_rgba(34,211,238,0.35)]"
                : "text-slate-200 border border-transparent hover:bg-white/5"
            } ${!hasLiveKeys ? "opacity-60 cursor-not-allowed" : ""}`}
            disabled={!hasLiveKeys}
          >
            Live
          </button>
        </div>
      </div>

      <NexusCard className="overflow-hidden border-white/15 bg-[#0c1826]/90">
        {ready ? (
          <iframe
            src="/financials"
            title="Finance Suite"
            className="h-[70vh] w-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads"
          />
        ) : (
          <div className="flex h-[70vh] items-center justify-center text-slate-300">Loading Finance Suite…</div>
        )}
      </NexusCard>
    </MainLayout>
  );
}
