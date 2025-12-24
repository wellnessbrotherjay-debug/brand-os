"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

type BackButtonProps = {
  href?: string;
  label?: string;
};

export default function BackButton({ href, label = "Back" }: BackButtonProps) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  }, [href, router]);

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/10"
    >
      <span aria-hidden>←</span>
      {label}
    </button>
  );
}
