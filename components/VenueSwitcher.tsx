"use client";

import Link from "next/link";
import { useVenueContext } from "@/lib/venue-context";

export default function VenueSwitcher() {
  const { venues, activeVenue, setActiveVenueId } = useVenueContext();

  if (!venues.length) {
    return (
      <Link
        href="/venues"
        className="inline-flex items-center rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-200 hover:border-sky-400/60 hover:text-white"
      >
        Create Venue
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-200">
      <select
        className="bg-transparent text-white focus:outline-none"
        value={activeVenue?.id ?? ""}
        onChange={(event) => {
          const nextId = event.target.value || null;
          setActiveVenueId(nextId);
        }}
      >
        {venues.map((venue) => (
          <option key={venue.id} value={venue.id}>
            {venue.name}
          </option>
        ))}
      </select>
      <Link
        href="/venues"
        className="rounded-full border border-white/20 px-2 py-1 text-[10px] tracking-[0.4em] text-slate-100 hover:border-sky-400/70 hover:text-white"
      >
        Edit
      </Link>
    </div>
  );
}
