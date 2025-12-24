import React from "react";
import { cn } from "@/lib/utils";

type NexusCardProps = React.HTMLAttributes<HTMLDivElement>;

export function NexusCard({ className, children, ...rest }: NexusCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
