"use client"

import { useCallback, useEffect, useState } from "react"
import AdminTable, { type AdminTableColumn } from "@/components/AdminTable"
import type { Database } from "@/lib/database.types"

const REFRESH_INTERVAL_MS = 15_000

type ExerciseRecord = Database["public"]["Tables"]["exercise_library"]["Row"]

const exerciseColumns: AdminTableColumn<ExerciseRecord>[] = [
  { key: "id", label: "ID", sortable: true, align: "left" },
  { key: "exercise_name", label: "Exercise Name" },
  { key: "primary_muscle_group", label: "Primary Muscle" },
  { key: "required_equipment", label: "Required Equipment" },
  { key: "difficulty_level", label: "Difficulty" },
  { key: "intensity", label: "Intensity" },
  { key: "training_type", label: "Training Type" },
  {
    key: "video_url",
    label: "Video",
    render: (row) =>
      row.video_url ? (
        <a
          href={row.video_url}
          target="_blank"
          rel="noreferrer"
          className="text-sky-600 underline"
        >
          View
        </a>
      ) : (
        "—"
      ),
  },
  {
    key: "thumbnail_url",
    label: "Thumbnail",
    render: (row) =>
      row.thumbnail_url ? (
        <a
          href={row.thumbnail_url}
          target="_blank"
          rel="noreferrer"
          className="text-sky-600 underline"
        >
          View
        </a>
      ) : (
        "—"
      ),
  },
  {
    key: "created_at",
    label: "Created",
    sortable: true,
    render: (row) =>
      row.created_at ? new Date(row.created_at).toLocaleString() : "—",
  },
]

export default function ExerciseLibraryAdminPage() {
  const [rows, setRows] = useState<ExerciseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/exercise-library", {
        cache: "no-store",
      })
      const payload = (await response.json()) as ExerciseRecord[] | { error?: string }

      if (!response.ok) {
        throw new Error(
          typeof payload === "object" && payload?.error
            ? payload.error
            : "Unable to load exercises"
        )
      }

      setRows(payload as ExerciseRecord[])
    } catch (err: unknown) {
      console.error("Failed to load exercise library", err)
      setError(err instanceof Error ? err.message : "Unable to load exercises")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchRows()
  }, [fetchRows])

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchRows()
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchRows])

  return (
    <main className="space-y-6 px-6 py-4">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin</p>
        <h1 className="text-3xl font-semibold text-slate-900">Exercise Library</h1>
        <p className="text-sm text-slate-500">
          Live synced with <span className="font-medium">Supabase</span> (public
          schema). Data refreshes automatically every 15 seconds.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Error loading exercise library: {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Fetching exercise library data from Supabase...
        </div>
      ) : (
        <AdminTable tableName="Exercise Library" columns={exerciseColumns} rows={rows} />
      )}
    </main>
  )
}
