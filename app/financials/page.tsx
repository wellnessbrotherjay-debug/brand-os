"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { computeRoi, type RoiInput } from "@/lib/roi-metrics";
import { ROIScenarios } from "@/lib/roi-scenarios";
import {
  createEmptyTables,
  ensureTableColumns,
  getTableColumns,
  type CompetitorPricingRow,
  type RoiRow,
  type RoiTableName,
  type StoredTables,
} from "@/lib/roi-store";
import { parse } from "papaparse";
import MainLayout from "@/components/MainLayout";

const sliderControls: Array<{
  key: keyof RoiInput;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}> = [
  { key: "classesPerDay", label: "Classes / day", min: 0, max: 12, step: 1 },
  { key: "clientsPerClass", label: "Clients / class", min: 0, max: 16, step: 1 },
  { key: "occupancy", label: "Occupancy %", min: 0, max: 100, step: 2, suffix: "%" },
  { key: "memberships", label: "Active memberships", min: 0, max: 320, step: 10 },
  { key: "classPacks", label: "Class packs / month", min: 0, max: 90, step: 5 },
  { key: "dayPasses", label: "Day passes / day", min: 0, max: 35, step: 1 },
  { key: "dropInPerDay", label: "Drop-ins / day", min: 0, max: 50, step: 1 },
  { key: "avgSpend", label: "Class price / booking", min: 0, max: 200000, step: 1000, suffix: "IDR" },
  { key: "monthlySalaries", label: "Monthly salaries", min: 0, max: 10000000, step: 250000, suffix: "IDR" },
  { key: "fixedCosts", label: "Fixed costs", min: 0, max: 5000000, step: 50000, suffix: "IDR" },
  { key: "variableCosts", label: "Variable costs", min: 0, max: 2500000, step: 25000, suffix: "IDR" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID").format(Math.round(value));

const formatSliderValue = (value: number, suffix?: string) => {
  if (!suffix) return value;
  if (suffix === "IDR") {
    return `${formatCurrency(value)} ${suffix}`;
  }
  return `${value} ${suffix}`;
};

const scenarioButtons = [
  { key: "base", label: "Base Case" },
  { key: "conservative", label: "Conservative" },
  { key: "aggressive", label: "Aggressive" },
];

const categoryDonut = (total: number) => [
  { name: "Bookings", value: total * 0.55 },
  { name: "Memberships", value: total * 0.18 },
  { name: "Day Passes", value: total * 0.15 },
  { name: "Class Packs", value: total * 0.12 },
];

const CATEGORY_TEASERS = {
  "Bookings": "High-energy flows, circuits, and strength cues to energize every guest.",
  "Memberships": "Strong retention programs with concierge-level service.",
  "Day Passes": "Flexible drop-in options to drive seasonal foot traffic.",
  "Class Packs": "Premium multi-class bundles for guests who stay longer.",
};

const normalizeCsvKey = (value?: string) =>
  (value ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

const DATA_SECTIONS: Array<{
  table: RoiTableName;
  title: string;
  description: string;
}> = [
  { table: "assets", title: "Assets / CAPEX", description: "Capture equipment, display pods, wearables, and tech investments." },
  { table: "staff_costs", title: "Staff costs", description: "List monthly salaries per role, including trainers, reception, and concierge." },
  { table: "opex", title: "Fixed OPEX", description: "Enter insurance, marketing, software, and utilities for every month." },
  { table: "variable_costs", title: "Variable costs", description: "Per-class consumables, per-member services, per-class energy." },
  { table: "packages", title: "Membership + packages", description: "Define all sold products (membership, day pass, class packs) along with price/duration." },
  { table: "bookings", title: "Booking projections", description: "Monthly booking counts, client mix, and revenue per plan." },
  { table: "competitor_pricing", title: "Competitor pricing", description: "Mirror our competitor drop-in/membership/class pack data for matching." },
  { table: "revenue_projection", title: "Revenue forecasts", description: "Projected monthly runway revenue or custom KPI projections." },
];

const sectionForTable = (table: RoiTableName) =>
  DATA_SECTIONS.find((section) => section.table === table)?.table ?? table;

export default function FinancialsPage() {
  const [input, setInput] = useState<RoiInput>(ROIScenarios.base);
  const [savedScenarios, setSavedScenarios] = useState<Record<string, RoiInput>>({});
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [tableData, setTableData] = useState<StoredTables>(createEmptyTables());
  const [savingTable, setSavingTable] = useState<RoiTableName | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<RoiTableName | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<RoiTableName, boolean>>(
    () => DATA_SECTIONS.reduce(
      (acc, section) => ({ ...acc, [section.table]: true }),
      {} as Record<RoiTableName, boolean>,
    ),
  );

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("roi-scenarios") : null;
    if (stored) {
      try {
        setSavedScenarios(JSON.parse(stored));
      } catch {
        setSavedScenarios({});
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("roi-scenarios", JSON.stringify(savedScenarios));
  }, [savedScenarios]);

  const refreshTables = async () => {
    try {
      const res = await fetch("/api/roi/data");
      if (!res.ok) throw new Error("Unable to load ROI tables");
      const json = await res.json();
      const baseTables = createEmptyTables();
      const normalized: StoredTables = {
        ...baseTables,
        ...(json?.tables ?? {}),
      };
      setTableData(normalized);
    } catch (error) {
      console.error("Failed to refresh tables", error);
      setTableData(createEmptyTables());
    }
  };

  useEffect(() => {
    refreshTables();
  }, []);

  const competitorPricing = useMemo(
    () =>
      (tableData.competitor_pricing ?? []).map((entry) => ({
        name: entry.name ?? "Competitor",
        drop_in: Number(entry.drop_in ?? 0),
        membership: Number(entry.membership ?? 0),
        class_pack: Number(entry.class_pack ?? 0),
      })),
    [tableData.competitor_pricing],
  );

  const roi = useMemo(() => computeRoi(input), [input]);

  const revenueVsCostData = roi.revenueForecast.slice(0, 8).map((entry) => ({
    month: entry.month,
    revenue: entry.value,
    cost: roi.monthlyCosts,
  }));

  const waterfall = [
    { name: "Revenue", value: roi.monthlyRevenue },
    { name: "Fixed", value: -input.fixedCosts },
    { name: "Variable", value: -input.variableCosts },
    { name: "Salaries", value: -input.monthlySalaries },
    { name: "Profit", value: roi.monthlyProfit },
  ];

  const categoryData = categoryDonut(roi.monthlyRevenue);
  const occupancyHeat = roi.occupancyCurve;

  const handlingSliderChange = (key: keyof RoiInput, value: number) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const applyScenario = (key: keyof typeof ROIScenarios) => {
    setInput(ROIScenarios[key]);
  };

  const saveScenario = () => {
    const label = window.prompt("Label this scenario", `Scenario ${Object.keys(savedScenarios).length + 1}`);
    if (!label) return;
    setSavedScenarios((prev) => ({ ...prev, [label]: input }));
  };

  const applySavedScenario = (label: string) => {
    const scenario = savedScenarios[label];
    if (scenario) {
      setInput(scenario);
    }
  };

  const sanitizeCellValue = (value: string, column: string) => {
    const normalized = column.toLowerCase();
    const numericKeywords = [
      "value",
      "salary",
      "amount",
      "cost",
      "price",
      "revenue",
      "drop",
      "membership",
      "class",
      "clients",
      "duration",
      "projected",
    ];
    const needsCleaning = numericKeywords.some((keyword) => normalized.includes(keyword));
    if (!needsCleaning) return value;
    return value.replace(/[^\d.]/g, "");
  };

  const handleRowChange = (table: RoiTableName, rowIndex: number, column: string, value: string) => {
    setTableData((prev) => {
      const rows = prev[table] ?? [];
      const updated = rows.map((row, index) =>
        index === rowIndex
          ? { ...row, [column]: sanitizeCellValue(value, column) }
          : row,
      );
      return { ...prev, [table]: updated };
    });
  };

  const addRow = (table: RoiTableName) => {
    const columns = getTableColumns(table);
    const emptyRow = columns.reduce((acc, column) => ({ ...acc, [column]: "" }), {} as RoiRow);
    setTableData((prev) => ({
      ...prev,
      [table]: [...(prev[table] ?? []), emptyRow],
    }));
  };

  const saveTable = async (table: RoiTableName, rowsOverride?: RoiRow[]) => {
    const rows = rowsOverride ?? tableData[table] ?? [];
    setSavingTable(table);
    setTableError(null);
    try {
      const res = await fetch("/api/roi/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, rows }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save table");
      }
      const body = await res.json();
      if (body?.rows) {
        setTableData((prev) => ({ ...prev, [table]: body.rows }));
      }
      setSavedSection(table);
      window.setTimeout(() => setSavedSection((prev) => (prev === table ? null : prev)), 2000);
    } catch (error) {
      console.error("Failed to save table", error);
      setTableError(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSavingTable(null);
    }
  };

  const toggleSection = (table: RoiTableName) => {
    setExpandedSections((prev) => ({
      ...prev,
      [table]: !prev[table],
    }));
  };

  const deleteRow = (table: RoiTableName, rowIndex: number) => {
    setTableData((prev) => {
      const rows = [...(prev[table] ?? [])];
      if (rowIndex < 0 || rowIndex >= rows.length) return prev;
      rows.splice(rowIndex, 1);
      return { ...prev, [table]: rows };
    });
  };

  const handleCsvUpload = async (table: RoiTableName, file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const parsed = parse<RoiRow>(text, { header: true, skipEmptyLines: true });
    if (parsed.errors.length) {
      setTableError(parsed.errors.map((error) => error.message).join("; "));
      return;
    }
    const columns = getTableColumns(table);
    const rows = parsed.data
      .map((row) => {
        const normalizedCells: Record<string, string> = {};
        Object.entries(row).forEach(([key, value]) => {
          const normalizedKey = normalizeCsvKey(key);
          normalizedCells[normalizedKey] = value ?? "";
        });
        const normalized: RoiRow = {};
        columns.forEach((column) => {
          const normalizedKey = normalizeCsvKey(column);
          normalized[column] = normalizedCells[normalizedKey] ?? "";
        });
        return normalized;
      })
      .filter((row) => ensureTableColumns(table, row));
    setTableData((prev) => ({ ...prev, [table]: rows }));
    await saveTable(table, rows);
    await refreshTables();
  };

  const handleGlobalImport = async (file: File | null) => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    setTableError(null);
    try {
      const res = await fetch("/api/import/csv", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Import failed");
      }
      if (body.warnings?.length) {
        setTableError(`Imported with ${body.warnings.length} warnings.`);
      }
      await refreshTables();
    } catch (error) {
      console.error("Import failed", error);
      setTableError(error instanceof Error ? error.message : "Import failed");
    }
  };

  const sectionTotals = (table: RoiTableName) => {
    const rows = tableData[table] ?? [];
    const columns = getTableColumns(table);
    const totals: Record<string, number> = {};
    rows.forEach((row) => {
      columns.forEach((column) => {
        const value = Number(row[column]);
        if (!Number.isNaN(value)) {
          totals[column] = (totals[column] ?? 0) + value;
        }
      });
    });
    return totals;
  };

  const matchPricing = (competitor: CompetitorPricingRow) => {
    const dropIn = Number(competitor.drop_in ?? 0);
    const membership = Number(competitor.membership ?? 0);
    const classPack = Number(competitor.class_pack ?? 0);
    setInput((prev) => ({
      ...prev,
      membershipPrice: membership || prev.membershipPrice,
      dayPassPrice: dropIn || prev.dayPassPrice,
      classPackPrice: classPack || prev.classPackPrice,
    }));
  };

  const requestAiSummary = async () => {
    setInsightLoading(true);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: "ROI cockpit" }),
      });
      const body = await res.json();
      setAiSummary(body?.ai?.summary ?? "No insights yet.");
    } catch (error) {
      console.error(error);
      setAiSummary("AI request failed, try again later.");
    } finally {
      setInsightLoading(false);
    }
  };

  const competitorColumns = [
    { label: "Drop-in", value: "drop_in" },
    { label: "Membership", value: "membership" },
    { label: "Class pack", value: "class_pack" },
  ];

  return (
    <MainLayout title="Financial engine for HotelFit" subtitle="Fathom-style ROI">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-6 text-white">
        <header className="space-y-2 text-center">
          <p className="text-sm text-slate-300">
            Live sliders, scenario presets, competitor intelligence, charts, and AI summaries—everything on one page.
          </p>
        </header>

        <section className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Scenario engine</p>
              <h2 className="text-2xl font-semibold text-white">Sliders + presets</h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              {scenarioButtons.map((button) => (
                <button
                  key={button.key}
                  type="button"
                  onClick={() => applyScenario(button.key as keyof typeof ROIScenarios)}
                  className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-200 transition hover:border-sky-400"
                >
                  {button.label}
                </button>
              ))}
              <button
                type="button"
                onClick={saveScenario}
                className="rounded-full border border-emerald-400 px-4 py-1 text-xs uppercase tracking-[0.3em] text-emerald-200"
              >
                Save scenario
              </button>
            </div>
          </div>
              <div className="grid gap-4 md:grid-cols-2">
                {sliderControls.map((control) => (
                  <div key={control.key} className="space-y-2 rounded-2xl border border-white/15 bg-black/40 p-4">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                    <span>{control.label}</span>
                    <span>{formatSliderValue(Number(input[control.key] ?? 0), control.suffix)}</span>
                  </div>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={Number(input[control.key] ?? control.min)}
                  onChange={(event) =>
                    handlingSliderChange(control.key, Number(event.target.value))
                  }
                  className="w-full accent-sky-500"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Financial data builder</p>
              <h2 className="text-2xl font-semibold text-white">Edit your sheets</h2>
              <p className="text-sm text-slate-400">
                Type values manually per sheet or upload a CSV and then fine-tune the rows below.
              </p>
            </div>
            <div className="flex gap-4 text-xs text-slate-400 flex-wrap">
              <div>Matches tabs: Assets, Staff, Fixed Costs, Variable Costs, Packages, Bookings, Competitors, Forecast</div>
              <label className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-white/80">
                Import from CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={(event) => handleGlobalImport(event.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <span className="text-[0.55rem] text-slate-400">Choose file</span>
              </label>
            </div>
          </div>
          <div className="space-y-6">
            {DATA_SECTIONS.map((section) => {
              const rows = tableData[section.table] ?? [];
              const columns = getTableColumns(section.table);
              const totals = sectionTotals(section.table);
              const isExpanded = expandedSections[section.table];
              return (
                <div
                  key={section.table}
                  className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/50 p-4 shadow"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleSection(section.table)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleSection(section.table);
                        }
                      }}
                      className="flex-1 cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                          {section.title}
                        </p>
                        <p className="text-sm text-slate-300">{section.description}</p>
                      </div>
                      <span className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-500">
                        {isExpanded ? "Collapse sheet" : "Open sheet"}
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="flex gap-2 flex-wrap text-[0.6rem] uppercase tracking-[0.4em] text-white/80">
                        <label className="text-xs text-slate-400">
                          Upload CSV
                          <input
                            type="file"
                            accept=".csv"
                            onChange={(event) =>
                              handleCsvUpload(section.table, event.target.files?.[0] ?? null)
                            }
                            className="mt-1"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => addRow(section.table)}
                          className="rounded-full border border-white/20 px-4 py-1 text-xs text-white/80"
                        >
                          Add row
                        </button>
                        <button
                          type="button"
                          onClick={() => saveTable(section.table)}
                          className="rounded-full border border-emerald-400 px-4 py-1 text-xs text-emerald-200"
                          disabled={savingTable === section.table}
                        >
                          {savingTable === section.table ? "Saving…" : "Save section"}
                        </button>
                        {savedSection === section.table && (
                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[0.55rem] text-emerald-300">
                            Saved
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {isExpanded ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-white">
                        <thead>
                          <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
                            {columns.map((column) => (
                              <th
                                key={column}
                                className="border-b border-white/10 px-3 py-2 text-left"
                              >
                                {column.replace(/_/g, " ")}
                              </th>
                            ))}
                            <th className="border-b border-white/10 px-3 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, rowIndex) => (
                            <tr key={`${section.table}-${rowIndex}`} className="border-b border-white/5">
                              {columns.map((column) => (
                                <td key={column} className="px-3 py-2">
                                  <input
                                    value={row[column] ?? ""}
                                    onChange={(event) =>
                                      handleRowChange(
                                        section.table,
                                        rowIndex,
                                        column,
                                        event.target.value,
                                      )
                                    }
                                    className="w-full rounded bg-black/40 px-2 py-1 text-sm text-white outline-none"
                                  />
                                </td>
                              ))}
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => deleteRow(section.table, rowIndex)}
                                  className="text-[0.6rem] uppercase tracking-[0.3em] text-rose-300"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        {rows.length > 0 && (
                          <tfoot>
                            <tr className="border-t border-white/10 bg-white/5">
                              {columns.map((column, index) => (
                                <td
                                  key={`${section.table}-total-${column}`}
                                  className="px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-300"
                                >
                                  {index === 0
                                    ? "Total"
                                    : totals[column]
                                    ? formatCurrency(+totals[column])
                                    : "-"}
                                </td>
                              ))}
                              <td className="px-3 py-2 text-right text-xs text-slate-400">—</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                      {!rows.length && (
                        <p className="mt-2 text-xs text-slate-500">
                          Start by adding rows or uploading a CSV.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Sheet collapsed. Click to open.</p>
                  )}
                </div>
              );
            })}
          </div>
          {tableError && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
              {tableError}
            </div>
          )}
        </section>


        <section className="space-y-6 rounded-3xl border border-white/10 bg-violet-950/40 p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">KPIs</p>
              <h2 className="text-3xl font-semibold">Performance snapshot</h2>
            </div>
            <div className="grid w-full grid-cols-2 gap-4 sm:w-auto sm:grid-cols-4">
              {[
                ["Monthly profit", `$${Math.round(roi.monthlyProfit).toLocaleString()}`],
                [
                  "Annual ROI",
                  `${roi.annualRoiPercent.toFixed(1)}%`,
                ],
                [
                  "Payback (months)",
                  Number.isFinite(roi.paybackMonths) ? roi.paybackMonths.toFixed(1) : "∞",
                ],
                [
                  "Breakeven bookings/day",
                  roi.breakevenBookingsPerDay.toFixed(1),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-black/50 p-4 text-xs uppercase tracking-[0.3em] text-slate-300"
                >
                  <div className="text-[0.6rem] tracking-[0.3em] text-slate-400">{label}</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Revenue vs cost</p>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={revenueVsCostData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#22c55e" />
                  <Line type="monotone" dataKey="cost" stroke="#38bdf8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Category split</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    fill="#0ea5e9"
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={["#22c55e", "#38bdf8", "#f97316", "#a855f7"][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-black/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">EBITDA waterfall</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={waterfall}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="value" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Occupancy curve</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={occupancyHeat}>
                <defs>
                  <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="occupancy" stroke="#22c55e" fillOpacity={1} fill="url(#occupancyGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">12-month forecast</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={roi.revenueForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#f97316" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-black/60 p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Competitor pricing</p>
              <button
                type="button"
                onClick={() => matchPricing(competitorPricing[0] ?? { name: "default", drop_in: 0, membership: 0, class_pack: 0 })}
                className="text-xs uppercase tracking-[0.3em] text-sky-400"
              >
                Match first
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {competitorPricing.map((competitor) => (
                <div
                  key={competitor.name}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold">{competitor.name}</div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Drop-in · ${competitor.drop_in} · Membership · ${competitor.membership}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => matchPricing(competitor)}
                      className="rounded-full border border-emerald-400 px-4 py-1 text-xs uppercase tracking-[0.3em] text-emerald-200"
                    >
                      Match pricing
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-3 text-sm text-slate-300">
                    {[
                      { label: "Drop-in", value: competitor.drop_in },
                      { label: "Membership", value: competitor.membership },
                      { label: "Class pack", value: competitor.class_pack },
                    ].map((column) => (
                      <div key={column.label} className="space-y-[0.1rem]">
                        <div className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-500">
                          {column.label}
                        </div>
                        <div>${column.value ?? "—"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/60 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">AI insights</p>
            <p className="mt-2 text-sm text-slate-300">
              Let the OpenAI agent review your tables and recommend pricing, cost-savings, and investor-ready summaries.
            </p>
            <div className="mt-4 flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={requestAiSummary}
                disabled={insightLoading}
                className="rounded-full border border-sky-400 px-5 py-2 text-xs uppercase tracking-[0.4em] text-sky-100 disabled:opacity-50"
              >
                {insightLoading ? "Summoning AI…" : "Generate AI summary"}
              </button>
              <a
                href="/api/export/xlsx"
                className="rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.4em] text-white transition hover:border-emerald-400"
              >
                Export XLSX
              </a>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/70 p-4 text-sm text-slate-200">
              {aiSummary ?? "AI summaries appear here once you request insights."}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Scenario archive</p>
            <div className="text-xs text-slate-500">{Object.keys(savedScenarios).length} saved</div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {Object.keys(savedScenarios).map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => applySavedScenario(label)}
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/80 text-left transition hover:border-sky-400/60"
              >
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</div>
                <p className="text-base font-semibold">{savedScenarios[label].classesPerDay} classes · {savedScenarios[label].occupancy}% occupancy</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Connect Google Sheets</p>
          <div className="mt-3 space-y-2">
            <p>
              Option A: Manual CSV uploads via <strong>/api/import/csv</strong>. Export from Google Sheets and upload
              for audited calibration. Suitable for client-facing versions and stable data capture.
            </p>
            <p>
              Option B: Real-time API sync using the Google Sheets API. Push edits into Supabase and trigger webhooks
              for live KPIs. Great for internal ops workflows once you’re ready for automation.
            </p>
          </div>
        </section>
      </main>
    </MainLayout>
  );
}
