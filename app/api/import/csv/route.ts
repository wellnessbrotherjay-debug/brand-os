import { NextResponse } from "next/server";
import { parse } from "papaparse";
import {
  createEmptyTables,
  ensureTableColumns,
  getTableColumns,
  registerImport,
  type RoiRow,
  type RoiTableName,
} from "@/lib/roi-store";

export async function POST(req: Request) {
  const form = await req.formData();
  const csvFile = form.get("file");
  if (!csvFile || typeof csvFile === "string") {
    return NextResponse.json({ error: "Missing CSV file upload" }, { status: 400 });
  }

  const text = await csvFile.text();
  const parsed = parse<RoiRow>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length) {
    return NextResponse.json({ error: parsed.errors.map((err) => err.message).join("; ") }, { status: 400 });
  }

  const tables = createEmptyTables();
  const invalidRows: string[] = [];
const tableNames = Object.keys(tables) as RoiTableName[];
const keywords: Record<RoiTableName, string[][]> = {
  assets: [["name", "item", "description"], ["value", "cost", "price"]],
  staff_costs: [["role", "position"], ["salary", "monthly", "pay"]],
  opex: [["item", "category", "description"], ["monthly", "cost", "amount"]],
  variable_costs: [["name", "item", "activity"], ["cost", "amount", "unit"]],
  packages: [["name", "package", "product"], ["price", "cost"], ["duration", "term"]],
  bookings: [["month"], ["bookings", "clients", "revenue", "sales"]],
  competitor_pricing: [["name", "venue", "competitor"], ["drop", "in", "per"], ["membership"], ["class", "pack"]],
  revenue_projection: [["month"], ["revenue", "projection", "forecast"]],
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const detectTableKey = (row: RoiRow): RoiTableName | null => {
  const rowKeys = new Set(Object.keys(row).map((key) => normalize(key)));
  let bestMatch: { table: RoiTableName | null; score: number } = {
    table: null,
    score: 0,
  };
  for (const table of tableNames) {
    const columns = getTableColumns(table).map((column) => normalize(column));
    const matches = columns.reduce(
      (count, column) => (rowKeys.has(column) ? count + 1 : count),
      0,
    );
    if (matches > bestMatch.score) {
      bestMatch = { table, score: matches };
    }
  }
  return bestMatch.score > 0 ? (bestMatch.table as RoiTableName) : null;
};

  parsed.data.forEach((row) => {
    let tableKey = (row.table as string | undefined)?.trim() as RoiTableName | undefined;
    const normalizedRow = { ...row };
    delete normalizedRow.table;
    const hasData = Object.values(normalizedRow).some(
      (value) => value !== undefined && value !== "",
    );
    if (!hasData) return;
    if (!tableKey) {
      tableKey = detectTableKey(normalizedRow) ?? undefined;
    }
    if (!tableKey || !tables[tableKey]) {
      invalidRows.push(`Unable to detect table for row: ${JSON.stringify(row)}`);
      return;
    }

    if (!ensureTableColumns(tableKey, normalizedRow)) {
      invalidRows.push(`Missing columns for table ${tableKey} in row: ${JSON.stringify(row)}`);
      return;
    }
    tables[tableKey].push(normalizedRow);
  });

  const totalValidRows = (Object.keys(tables) as RoiTableName[]).reduce(
    (count, table) => count + tables[table].length,
    0,
  );
  if (!totalValidRows) {
    return NextResponse.json(
      { error: "Validation failed", details: invalidRows },
      { status: 422 },
    );
  }

  const version = `import-${Date.now()}`;
  registerImport(version, tables);

  return NextResponse.json({
    success: true,
    version,
    counts: Object.fromEntries(
      (Object.keys(tables) as RoiTableName[]).map((table) => [table, tables[table].length]),
    ),
    warnings: invalidRows,
  });
}
