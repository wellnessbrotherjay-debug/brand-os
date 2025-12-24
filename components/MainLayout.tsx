import React from "react";
import { cn } from "@/lib/utils";

type MainLayoutProps = {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClassName?: string;
};

/**
 * MainLayout provides a consistent Nexus-style shell: gradient background,
 * soft borders, and unified typography for admin/marketing surfaces.
 */
export default function MainLayout({
  title,
  subtitle,
  actions,
  children,
  maxWidthClassName = "max-w-6xl",
}: MainLayoutProps) {
  return (
    <div
      className="min-h-screen w-full text-slate-100"
      style={{
        background:
          "radial-gradient(1200px 800px at 50% 12%, rgba(56,189,248,0.12), transparent), radial-gradient(1400px 1000px at 20% 30%, rgba(20,184,166,0.08), transparent), linear-gradient(180deg,#040b14,#071423 55%,#050c18)",
      }}
    >
      <div className={cn("mx-auto px-6 py-10 lg:py-14", maxWidthClassName)}>
        {(title || subtitle || actions) && (
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              {subtitle ? <p className="text-sm text-cyan-200/80">{subtitle}</p> : null}
              {title ? (
                <h1 className="text-3xl font-semibold leading-tight tracking-tight">{title}</h1>
              ) : null}
            </div>
            {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
