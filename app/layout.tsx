import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

import { VenueProvider } from "@/lib/venue-context";
import PwaUpdater from "@/components/PwaUpdater";
import { BrandProvider } from "@/lib/brand-context";

export const metadata: Metadata = {
  title: "Exequte Hotel",
  description: "Workout application for hotels",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#00bfff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-neutral-950 text-neutral-100">
        <VenueProvider>
          <BrandProvider>
            <PwaUpdater />
            <AppShell />
            <div className="app-shell-content">{children}</div>
          </BrandProvider>
        </VenueProvider>
      </body>
    </html>
  );
}
// Force rebuild for env vars
