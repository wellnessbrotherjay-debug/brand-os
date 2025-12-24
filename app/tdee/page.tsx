"use client";

import { useEffect, useMemo, useState } from "react";
import {
  storage,
  type WorkoutSetup,
} from "@/lib/workout-engine/storage";
import { useVenueContext } from "@/lib/venue-context";
import { resolveBrandColors } from "@/lib/workout-engine/brand-colors";
import {
  calculateTDEE,
  estimateNutritionTargets,
  type TdeeRequest,
} from "@/lib/integrations/tdee";

export default function TdeePage() {
  const { activeVenue } = useVenueContext();
  const [setup, setSetup] = useState<WorkoutSetup | null>(null);
  const [form, setForm] = useState<TdeeRequest>({
    age: 32,
    heightCm: 175,
    weightKg: 75,
    activityLevel: "moderate",
    goal: "recomposition",
  });
  const [result, setResult] = useState(() => calculateTDEE(form));

  useEffect(() => {
    setSetup(storage.getSetup());
  }, []);

  const brandColors = useMemo(
    () => resolveBrandColors({ activeVenue, setup }),
    [activeVenue, setup]
  );

  useEffect(() => {
    setResult(calculateTDEE(form));
  }, [form]);

  const nutritionTargets = estimateNutritionTargets(result, form.goal);

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 lg:p-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">TDEE Lab</p>
          <h1 className="text-3xl font-bold" style={{ color: brandColors.primary }}>
            Metabolic Blueprint
          </h1>
          <p className="text-sm text-slate-400">
            Use VisBody + smart scale readings to auto-fill this calculator, then push the macros to
            the meal-planning service.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <section className="rounded-3xl border border-white/10 bg-black/50 p-6">
            <h2 className="text-xl font-semibold mb-4">Guest Inputs</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {([
                { label: "Age", key: "age", suffix: "yrs" },
                { label: "Height", key: "heightCm", suffix: "cm" },
                { label: "Weight", key: "weightKg", suffix: "kg" },
              ] as const).map((field) => (
                <label key={field.key} className="text-sm text-slate-300">
                  {field.label}
                  <input
                    type="number"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white"
                    value={form[field.key]}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        [field.key]: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                Activity Level
                <select
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white"
                  value={form.activityLevel}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, activityLevel: event.target.value as TdeeRequest["activityLevel"] }))
                  }
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Goal
                <select
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white"
                  value={form.goal}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, goal: event.target.value as TdeeRequest["goal"] }))
                  }
                >
                  <option value="fat-loss">Fat Loss</option>
                  <option value="recomposition">Recomposition</option>
                  <option value="performance">Performance</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-black/50 p-6">
            <h2 className="text-xl font-semibold mb-4">Outputs</h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Daily Energy</p>
              <p className="mt-2 text-4xl font-bold" style={{ color: brandColors.accent }}>
                {result.calories} kcal
              </p>
              <p className="text-xs text-slate-500 mt-1">Basal Metabolic Rate: {result.bmr} kcal</p>
            </div>
            <div className="mt-4 grid gap-3">
              {nutritionTargets.map((target) => (
                <div
                  key={target.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-sm"
                >
                  <span className="text-slate-300">{target.label}</span>
                  <span style={{ color: brandColors.primary }}>{target.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
