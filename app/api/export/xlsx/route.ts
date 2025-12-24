import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import {
  getLatestVersion,
  getTableColumns,
  getTables,
  type RoiTableName,
} from "@/lib/roi-store";
import { computeRoi } from "@/lib/roi-metrics";
import { ROIScenarios } from "@/lib/roi-scenarios";

const TITLE_MAP: Record<RoiTableName, string> = {
  assets: "CAPEX Assets",
  staff_costs: "Staff Costs",
  opex: "OPEX",
  variable_costs: "Variable Costs",
  packages: "Packages",
  bookings: "Bookings",
  competitor_pricing: "Competitor Pricing",
  revenue_projection: "Revenue Projection",
};

const sanitizeValue = (value: unknown) => {
  if (typeof value === "number") return value;
  if (!value) return "";
  return String(value);
};

const buildWorkbook = () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HotelFit ROI Engine";
  workbook.created = new Date();

  const tables = getTables();

  (Object.keys(tables) as RoiTableName[]).forEach((table) => {
    const records = tables[table];
    const columns = getTableColumns(table);
    const sheet = workbook.addWorksheet(TITLE_MAP[table]);
    sheet.columns = columns.map((column) => ({
      header: column.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      key: column,
      width: 18,
    }));
    records.forEach((row) => {
      sheet.addRow(columns.map((column) => sanitizeValue(row[column])));
    });
  });

  const roiSheet = workbook.addWorksheet("ROI Summary");
  const baseScenario = ROIScenarios.base;
  const roi = computeRoi(baseScenario);
  roiSheet.addRow(["Import Version", getLatestVersion() ?? "n/a"]);
  roiSheet.addRow(["Monthly Revenue", roi.monthlyRevenue.toFixed(2)]);
  roiSheet.addRow(["Monthly Profit", roi.monthlyProfit.toFixed(2)]);
  roiSheet.addRow(["Monthly Costs", roi.monthlyCosts.toFixed(2)]);
  roiSheet.addRow(["Annual ROI (%)", roi.annualRoiPercent.toFixed(1)]);
  roiSheet.addRow([
    "Payback Months",
    Number.isFinite(roi.paybackMonths) ? roi.paybackMonths.toFixed(1) : "∞",
  ]);
  roiSheet.addRow(["Breakeven Bookings / day", roi.breakevenBookingsPerDay.toFixed(1)]);
  roiSheet.addRow(["EBITDA", roi.ebitda.toFixed(2)]);

  const revenueSheet = workbook.addWorksheet("Revenue Forecast");
  revenueSheet.columns = [
    { header: "Month", key: "month", width: 12 },
    { header: "Projected Revenue", key: "value", width: 16 },
  ];
  roi.revenueForecast.forEach((entry) => revenueSheet.addRow(entry));

  const occupancySheet = workbook.addWorksheet("Occupancy Curve");
  occupancySheet.columns = [
    { header: "Month", key: "month", width: 12 },
    { header: "Occupancy %", key: "occupancy", width: 16 },
  ];
  roi.occupancyCurve.forEach((entry) => occupancySheet.addRow(entry));

  return workbook;
};

const respondWithWorkbook = async () => {
  const workbook = buildWorkbook();
  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="hotelfit-roi.xlsx"',
    },
  });
};

export async function POST() {
  return respondWithWorkbook();
}

export async function GET() {
  return respondWithWorkbook();
}
