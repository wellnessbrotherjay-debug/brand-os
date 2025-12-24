"use client";

import { useEffect, useMemo, useState } from "react";
import {
  VENUES_UPDATED_EVENT,
  createVenue,
  deleteVenue,
  getActiveVenueId,
  getVenues,
  setActiveVenueId,
  updateVenue,
  type BrandPalette,
  type VenueProfile,
} from "@/lib/workout-engine/storage";
import MainLayout from "@/components/MainLayout";

const DEFAULT_COLORS: BrandPalette = {
  primary: "#00BFFF",
  secondary: "#14B8A6",
  accent: "#F59E0B",
};

type VenueFormState = {
  name: string;
  logo: string;
  primary: string;
  secondary: string;
  accent: string;
};

function buildInitialForm(venue?: VenueProfile | null): VenueFormState {
  if (!venue) {
    return {
      name: "",
      logo: "",
      primary: DEFAULT_COLORS.primary,
      secondary: DEFAULT_COLORS.secondary,
      accent: DEFAULT_COLORS.accent,
    };
  }
  return {
    name: venue.name,
    logo: venue.logo ?? "",
    primary: venue.colors.primary,
    secondary: venue.colors.secondary,
    accent: venue.colors.accent,
  };
}

export default function VenueManagerPage() {
  const [venues, setVenues] = useState<VenueProfile[]>([]);
  const [activeVenueId, setActiveVenueIdState] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [form, setForm] = useState<VenueFormState>(buildInitialForm());
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === selectedVenueId) ?? null,
    [venues, selectedVenueId]
  );

  const isEditing = Boolean(selectedVenueId && selectedVenue);

  const refreshVenues = () => {
    setVenues(getVenues());
    setActiveVenueIdState(getActiveVenueId());
  };

  useEffect(() => {
    refreshVenues();
    const handler = () => refreshVenues();
    window.addEventListener(VENUES_UPDATED_EVENT, handler);
    return () => window.removeEventListener(VENUES_UPDATED_EVENT, handler);
  }, []);

  useEffect(() => {
    setForm(buildInitialForm(selectedVenue));
  }, [selectedVenueId, selectedVenue]);

  const handleFormChange = (field: keyof VenueFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewVenue = () => {
    setSelectedVenueId(null);
    setForm(buildInitialForm());
    setError(null);
    setStatus(null);
  };

  const handleSave = () => {
    setError(null);
    setStatus(null);
    if (!form.name.trim()) {
      setError("Venue name is required");
      return;
    }
    const payload = {
      name: form.name.trim(),
      logo: form.logo.trim() || null,
      colors: {
        primary: form.primary,
        secondary: form.secondary,
        accent: form.accent,
      },
    };

    if (isEditing && selectedVenueId) {
      const updated = updateVenue(selectedVenueId, payload);
      if (!updated) {
        setError("Unable to update venue. Please try again.");
        return;
      }
      setStatus("Venue updated");
    } else {
      const created = createVenue(payload);
      if (!created) {
        setError("Unable to create venue. Please try again.");
        return;
      }
      setSelectedVenueId(created.id);
      setStatus("Venue created & activated");
    }
  };

  const handleSetActive = (venueId: string) => {
    setActiveVenueId(venueId);
    setStatus("Active venue updated");
  };

  const handleDelete = (venueId: string) => {
    if (!window.confirm("Delete this venue? This cannot be undone.")) return;
    deleteVenue(venueId);
    if (selectedVenueId === venueId) {
      handleNewVenue();
    }
    setStatus("Venue deleted");
  };

  const activeColors = selectedVenue?.colors ?? DEFAULT_COLORS;

  return (
    <MainLayout title="Manage Venues" subtitle="Venue Console">
      <div className="mx-auto max-w-6xl px-6 py-10 text-white">
        <header className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.45em] text-sky-400/80">
            Venue Console
          </p>
          <h1 className="heading-font text-3xl font-semibold">Manage Venues</h1>
          <p className="mt-2 text-sm text-slate-400">
            Add new venues, edit branding, and choose which venue powers the builder experience.
          </p>
          <div className="mt-4 text-xs text-slate-400">
            Active Venue ID: {activeVenueId ?? "None"}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm uppercase tracking-[0.35em] text-slate-400">
                Venues ({venues.length})
              </h2>
              <button
                type="button"
                onClick={handleNewVenue}
                className="rounded-full border border-sky-400/60 px-4 py-1 text-xs uppercase tracking-[0.35em] text-sky-200"
              >
                + New
              </button>
            </div>
            {venues.length ? (
              <div className="space-y-3">
                {venues.map((venue) => {
                  const isActive = venue.id === activeVenueId;
                  const isSelected = venue.id === selectedVenueId;
                  return (
                    <div
                      key={venue.id}
                      className={`rounded-xl border px-4 py-3 text-sm transition ${isSelected ? "border-sky-400 bg-sky-500/10" : "border-white/10 bg-black/30"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{venue.name}</p>
                          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                            {isActive ? "Active" : "Inactive"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedVenueId(venue.id)}
                            className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetActive(venue.id)}
                            className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.35em] ${isActive
                              ? "border-emerald-400 text-emerald-300"
                              : "border-white/20 text-white"
                              }`}
                          >
                            {isActive ? "Active" : "Set Active"}
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {(["primary", "secondary", "accent"] as const).map((token) => (
                          <div key={token} className="flex flex-col items-center text-[9px] uppercase tracking-[0.4em] text-slate-500">
                            <span>{token}</span>
                            <span
                              className="mt-1 h-6 w-6 rounded-full border border-white/10"
                              style={{ backgroundColor: venue.colors[token] }}
                            />
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(venue.id)}
                        className="mt-3 text-[11px] uppercase tracking-[0.35em] text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No venues yet. Create one to get started.</p>
            )}
          </div>

          <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
              {isEditing ? "Edit Venue" : "New Venue"}
            </p>
            <h2 className="text-2xl font-semibold text-white mt-1">
              {isEditing ? selectedVenue?.name : "Create a Venue"}
            </h2>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.35em] text-slate-400">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => handleFormChange("name", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
                  placeholder="Sunset Tower Wellness"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.35em] text-slate-400">Logo URL</label>
                <input
                  type="url"
                  value={form.logo}
                  onChange={(event) => handleFormChange("logo", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
                  placeholder="https://example.com/logo.svg"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {(["primary", "secondary", "accent"] as const).map((token) => (
                  <div key={token}>
                    <label className="text-xs uppercase tracking-[0.35em] text-slate-400">
                      {token}
                    </label>
                    <input
                      type="color"
                      value={form[token]}
                      onChange={(event) => handleFormChange(token, event.target.value)}
                      className="mt-2 h-12 w-full cursor-pointer rounded border border-white/10"
                    />
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Preview</p>
                <div className="mt-3 flex gap-3">
                  {(["primary", "secondary", "accent"] as const).map((token) => (
                    <div key={token} className="flex flex-col items-center text-[10px] uppercase tracking-[0.35em] text-slate-500">
                      <span>{token}</span>
                      <span
                        className="mt-1 h-10 w-10 rounded-full border border-white/10"
                        style={{
                          backgroundColor:
                            token === "primary"
                              ? form.primary
                              : token === "secondary"
                                ? form.secondary
                                : form.accent,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              {status ? <p className="text-sm text-emerald-400">{status}</p> : null}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 rounded-lg border border-sky-400/70 bg-sky-500/10 px-4 py-3 text-sm uppercase tracking-[0.4em] text-sky-100"
                >
                  {isEditing ? "Save Venue" : "Create Venue"}
                </button>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => handleSetActive(selectedVenueId!)}
                    className="rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-4 py-3 text-sm uppercase tracking-[0.4em] text-emerald-100"
                  >
                    Set Active
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
