"use client";

import { motion } from "framer-motion";
import { useBranding } from "@/lib/hooks/useBranding";
import { useGreetingClock } from "@/lib/hooks/useGreetingClock";
import BrandErrorBoundary from "@/components/BrandErrorBoundary";
import BackButton from "@/components/BackButton";
import { DEFAULT_WELCOME_VIDEO_URL } from "@/lib/brandConfig";
import { Stream } from "@cloudflare/stream-react";

type BrandScreenProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
};

export default function BrandScreen({ eyebrow, title, description, children, actions, backHref, backLabel }: BrandScreenProps) {
  const { brand, ready } = useBranding();
  const { timeLabel, greeting } = useGreetingClock();

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center bg-black text-white">Loading…</div>;
  }

  return (
    <BrandErrorBoundary>
      <div className="relative min-h-screen overflow-hidden bg-black text-white" style={{ fontFamily: brand.font }}>
        {/* Check if video URL is a Cloudflare Stream URL or ID */
          (brand.videoUrl?.includes('cloudflarestream.com') || brand.videoUrl?.length === 32) ? (
            <div className="absolute inset-0 h-full w-full">
              <Stream
                src={brand.videoUrl ?? DEFAULT_WELCOME_VIDEO_URL}
                autoplay
                muted
                loop
                controls={false}
                responsive={false}
                className="h-full w-full object-cover opacity-30"
              />
            </div>
          ) : (
            <video
              className="absolute inset-0 h-full w-full object-cover opacity-30"
              src={brand.videoUrl ?? DEFAULT_WELCOME_VIDEO_URL}
              autoPlay
              muted
              loop
              playsInline
            />
          )}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${brand.backgroundUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-black/60" />
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
          <header className="flex flex-wrap items-start justify-between gap-6">
            <div>
              {backHref !== undefined && (
                <div className="mb-4">
                  <BackButton href={backHref} label={backLabel} />
                </div>
              )}
              <p className="text-xs uppercase tracking-[0.45em]" style={{ color: brand.accent }}>
                {eyebrow ?? "Hotel Fit Collection"}
              </p>
              <div className="mt-4 flex items-center gap-4">
                <div className="h-16 w-16 rounded-full border border-white/15 bg-black/40 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="h-full w-full object-contain"
                    onError={(event) => {
                      (event.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-4xl font-semibold tracking-tight">{title ?? brand.name}</h1>
                  <p className="text-sm text-zinc-300">{description ?? "Curated by Hotel Fit Solutionss™"}</p>
                  {actions && <div className="mt-3 flex flex-wrap gap-3">{actions}</div>}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold">{timeLabel}</p>
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">{greeting}</p>
            </div>
          </header>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mt-12 flex flex-1 flex-col"
          >
            {children}
          </motion.div>
          <footer className="mt-10 text-center text-xs uppercase tracking-[0.35em] text-zinc-500">
            Powered by Hotel Fit Solutionss™
          </footer>
        </div>
      </div>
    </BrandErrorBoundary>
  );
}
