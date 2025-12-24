import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type NexusButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:ring-offset-2 focus:ring-offset-transparent";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-cyan-500/90 to-emerald-400/90 text-slate-900 hover:from-cyan-400 hover:to-emerald-300 shadow-[0_15px_40px_rgba(34,211,238,0.35)] border border-cyan-300/60",
  secondary:
    "border border-cyan-300/50 bg-white/5 text-cyan-50 hover:bg-white/10 hover:border-cyan-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
  ghost: "text-slate-200 hover:bg-white/5 border border-transparent",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm uppercase tracking-[0.2em]",
};

export function NexusButton({ variant = "primary", size = "md", className, asChild = false, ...rest }: NexusButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(base, variants[variant], sizes[size], className)} {...rest} />;
}
