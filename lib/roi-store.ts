export type RoiTableName =
  | "assets"
  | "staff_costs"
  | "opex"
  | "variable_costs"
  | "packages"
  | "bookings"
  | "competitor_pricing"
  | "revenue_projection";

export type RoiRow = Record<string, string | number>;

const TABLE_SCHEMAS: Record<RoiTableName, string[]> = {
  assets: ["name", "value"],
  staff_costs: ["role", "monthly_salary"],
  opex: ["item", "monthly_amount"],
  variable_costs: ["name", "cost_type", "amount"],
  packages: ["name", "price", "duration_months"],
  bookings: ["month", "clients", "revenue"],
  competitor_pricing: ["name", "drop_in", "membership", "class_pack"],
  revenue_projection: ["month", "projected_revenue"],
};

export type StoredTables = Record<RoiTableName, RoiRow[]>;

const createEmptyTables = (): StoredTables =>
  (Object.keys(TABLE_SCHEMAS) as RoiTableName[]).reduce((acc, table) => {
    acc[table] = [];
    return acc;
  }, {} as StoredTables);

const store = {
  tables: createEmptyTables(),
  version: null as string | null,
  history: [] as Array<{ version: string; timestamp: number }>,
};

export function registerImport(version: string, records: StoredTables) {
  store.tables = { ...records };
  store.version = version;
  store.history.unshift({ version, timestamp: Date.now() });
  return store;
}

export function getTables(): StoredTables {
  return store.tables;
}

export function getTable(name: RoiTableName): RoiRow[] {
  return store.tables[name] ?? [];
}

export function getLatestVersion(): string | null {
  return store.version;
}

export function getImportHistory() {
  return store.history;
}

export function ensureTableColumns(table: RoiTableName, row: RoiRow) {
  const required = TABLE_SCHEMAS[table];
  return required.every((column) => row[column] !== undefined);
}

export function getTableColumns(table: RoiTableName): string[] {
  return TABLE_SCHEMAS[table];
}

export function setTable(table: RoiTableName, rows: RoiRow[]) {
  store.tables[table] = rows;
  return store.tables;
}

export function resetTables() {
  store.tables = createEmptyTables();
  return store.tables;
}

export type CompetitorPricingRow = {
  name: string;
  drop_in: number;
  membership: number;
  class_pack: number;
};

export { createEmptyTables };
