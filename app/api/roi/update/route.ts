import { NextResponse } from "next/server";
import { setTable, type RoiTableName } from "@/lib/roi-store";

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({}));
  const table = payload.table as RoiTableName | undefined;
  const rows = Array.isArray(payload.rows) ? payload.rows : null;

  if (!table || !rows) {
    return NextResponse.json({ error: "table and rows are required" }, { status: 400 });
  }

  try {
    const updated = setTable(table, rows);
    return NextResponse.json({ success: true, table, rows: updated[table] });
  } catch (error) {
    console.error("ROI table update failed", error);
    return NextResponse.json({ error: "Unable to update table" }, { status: 500 });
  }
}
