"use client"

import { useCallback, useEffect, useState } from "react"
import AdminTable, { type AdminTableColumn } from "@/components/AdminTable"
import type { Database } from "@/lib/database.types"

const REFRESH_INTERVAL_MS = 15_000

type EquipmentRecord = Database["public"]["Tables"]["equipment_library"]["Row"]

const equipmentColumns: AdminTableColumn<EquipmentRecord>[] = [
  { key: "id", label: "ID", sortable: true, align: "left" },
  { key: "equipment_name", label: "Equipment Name" },
  { key: "category", label: "Category" },
  { key: "size_length", label: "Length", align: "right" },
  { key: "size_width", label: "Width", align: "right" },
  { key: "size_height", label: "Height", align: "right" },
  { key: "weight", label: "Weight", align: "right" },
  { key: "required_space", label: "Required Space", align: "right" },
  {
    key: "image_url",
    label: "Image",
    render: (row) =>
      row.image_url ? (
        <a
          href={row.image_url}
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

export default function EquipmentLibraryAdminPage() {
  const [rows, setRows] = useState<EquipmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/equipment-library", {
        cache: "no-store",
      })
      const payload = (await response.json()) as
        | EquipmentRecord[]
        | { error?: string }

      if (!response.ok) {
        throw new Error(
          typeof payload === "object" && payload?.error
            ? payload.error
            : "Unable to load equipment"
        )
      }

      setRows(payload as EquipmentRecord[])
    } catch (err: unknown) {
      console.error("Failed to load equipment library", err)
      setError(err instanceof Error ? err.message : "Unable to load equipment")
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
        <h1 className="text-3xl font-semibold text-slate-900">Equipment Library</h1>
        <p className="text-sm text-slate-500">
          Live synced with <span className="font-medium">Supabase</span> (public
          schema). Data refreshes automatically every 15 seconds.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Error loading equipment library: {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Fetching equipment library data from Supabase...
        </div>
      ) : (
        <AdminTable tableName="Equipment Library" columns={equipmentColumns} rows={rows} />
      )}
    </main>
  )
}
