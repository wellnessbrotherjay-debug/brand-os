import { NextResponse } from "next/server";
import { getTables, getLatestVersion } from "@/lib/roi-store";

export async function GET() {
  const tables = getTables();
  return NextResponse.json({
    version: getLatestVersion(),
    tables,
  });
}
