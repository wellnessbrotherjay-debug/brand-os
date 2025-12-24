"use client"

import Link from "next/link"

const ADMIN_LINKS = [
  {
    title: "Exercise Library",
    description: "View every exercise row synced from Supabase, including difficulty, intensity, equipment, video, and thumbnail data.",
    href: "/admin/exercise-library",
  },
  {
    title: "Equipment Library",
    description: "Browse all equipment assets, dimensions, weight, space requirements, and images sourced directly from Supabase.",
    href: "/admin/equipment-library",
  },
]

export default function SetupConsolePage() {
  return (
    <main className="space-y-6 px-6 py-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Setup Console</p>
        <h1 className="text-3xl font-semibold text-slate-900">Library Catalogs</h1>
        <p className="max-w-2xl text-sm text-slate-500">
          Use these admin views to inspect the live exercise and equipment libraries that power the guest-facing workout experience.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {ADMIN_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow transition hover:border-slate-300 hover:shadow-lg"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{link.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{link.description}</p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-sky-600">
              Open view ↗
            </span>
          </Link>
        ))}
      </div>
    </main>
  )
}
