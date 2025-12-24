"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"

export type AdminTableColumn<T extends Record<string, unknown>> = {
  key: keyof T
  label: string
  sortable?: boolean
  align?: "left" | "center" | "right"
  render?: (row: T) => ReactNode
}

type SortConfig<T extends Record<string, unknown>> = {
  key: keyof T
  direction: "asc" | "desc"
}

type AdminTableProps<T extends Record<string, unknown>> = {
  tableName: string
  columns: AdminTableColumn<T>[]
  rows: T[]
}

const normalizeSearchValue = (value: unknown): string => {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value.toLowerCase()
  if (typeof value === "number" || typeof value === "boolean") return String(value).toLowerCase()
  return JSON.stringify(value).toLowerCase()
}

const defaultCellValue = (value: unknown) => {
  if (value === null || value === undefined) return "—"
  if (typeof value === "string") return value
  if (typeof value === "number") return value.toLocaleString()
  if (value instanceof Date) return value.toLocaleString()
  return JSON.stringify(value)
}

export default function AdminTable<T extends Record<string, unknown>>({
  tableName,
  columns,
  rows,
}: AdminTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null)

  const searchId = `${tableName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-search`
  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredRows = useMemo(() => {
    if (!normalizedSearch) return rows
    return rows.filter((row) => {
      const aggregate = columns
        .map((column) => normalizeSearchValue(row[column.key]))
        .join(" ")
      return aggregate.includes(normalizedSearch)
    })
  }, [columns, normalizedSearch, rows])

  const sortedRows = useMemo(() => {
    if (!sortConfig) return filteredRows
    return [...filteredRows].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      if (aValue === bValue) return 0
      const direction = sortConfig.direction === "asc" ? 1 : -1
      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * direction
      }
      const aString = normalizeSearchValue(aValue)
      const bString = normalizeSearchValue(bValue)
      return aString.localeCompare(bString, undefined, { numeric: true }) * direction
    })
  }, [filteredRows, sortConfig])

  const handleSort = (column: AdminTableColumn<T>) => {
    if (column.sortable === false) return
    setSortConfig((prev) => {
      if (!prev || prev.key !== column.key) {
        return { key: column.key, direction: "asc" }
      }
      if (prev.direction === "asc") {
        return { key: column.key, direction: "desc" }
      }
      return null
    })
  }

  const renderCell = (row: T, column: AdminTableColumn<T>) => {
    if (column.render) {
      return column.render(row)
    }
    const value = row[column.key]
    return defaultCellValue(value)
  }

  const sortIndicator = (column: AdminTableColumn<T>) => {
    if (!sortConfig || sortConfig.key !== column.key) return "⇅"
    return sortConfig.direction === "asc" ? "▲" : "▼"
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{tableName}</p>
          <p className="text-sm text-slate-600">Showing {sortedRows.length} of {rows.length} entries</p>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
          <label htmlFor={searchId} className="sr-only">
            Search {tableName}
          </label>
          <input
            id={searchId}
            placeholder={`Search ${tableName}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-w-[200px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-widest text-slate-500">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className={`px-3 py-3 font-semibold ${column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left"}`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(column)}
                    className="flex w-full items-center justify-between gap-2"
                  >
                    <span>{column.label}</span>
                    <span className="text-xs text-slate-400">{sortIndicator(column)}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-6 text-center text-sm text-slate-500">
                  No records found.
                </td>
              </tr>
            ) : (
              sortedRows.map((row, rowIndex) => (
                <tr key={`row-${(row as { id?: string | number }).id ?? rowIndex}`} className="odd:bg-slate-50">
                  {columns.map((column) => (
                    <td
                      key={`${String(column.key)}-${rowIndex}`}
                      className={`px-3 py-3 align-top text-[13px] ${column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left"}`}
                    >
                      {renderCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
