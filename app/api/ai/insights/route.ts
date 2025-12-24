import { NextResponse } from "next/server";
import OpenAI from "openai";
import { computeRoi } from "@/lib/roi-metrics";
import { ROIScenarios } from "@/lib/roi-scenarios";
import { getTables } from "@/lib/roi-store";

const DEFAULT_PROMPT =
  "Summarize the Fathom-style ROI data for HotelFit. Identify 2 quick cost reduction ideas, 2 pricing adjustments, and provide a one-paragraph investor update.";

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({}));
  const key = process.env.OPENAI_API_KEY;
  const tables = getTables();

  if (!key) {
    return NextResponse.json({
      ai: {
        summary: "OpenAI API key not found. Install OPENAI_API_KEY to enable AI reports.",
        recommendations: [
          "Review staffing mix in staff_costs and cut unused roles.",
          "Test a slightly higher membership price when occupancy exceeds 80%.",
        ],
      },
      tables,
    });
  }

  const client = new OpenAI({ apiKey: key });
  const prompt = `${DEFAULT_PROMPT}\n\nDATA HIGHLIGHTS:\nROI metrics: ${JSON.stringify(
    computeRoi(ROIScenarios.base),
  )}\nTables: ${Object.keys(tables)
    .map((table) => `${table}: ${tables[table].length} rows`)
    .join(", ")}\nADDITIONAL CONTEXT: ${payload.context ?? "N/A"}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });
    const text = completion.choices?.[0]?.message?.content ?? "No response";
    return NextResponse.json({ ai: { summary: text }, tables });
  } catch (error) {
    console.error("AI suggestion failed", error);
    return NextResponse.json(
      {
        ai: {
          summary:
            "AI request failed; check OPENAI_API_KEY and network. Here's a fallback summary based on base metrics.",
        },
        tables,
      },
      { status: 500 },
    );
  }
}
