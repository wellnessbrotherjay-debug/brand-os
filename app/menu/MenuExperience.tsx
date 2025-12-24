"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useBranding } from "@/lib/hooks/useBranding";
import BrandScreen from "@/components/BrandScreen";
import { supabase } from "@/lib/supabase";
import { calculateTDEE, type TdeeRequest } from "@/lib/integrations/tdee";
import { fetchVhpMenuFeed } from "@/lib/integrations/vhp";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  base_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  category: string | null;
  image_url?: string | null;
};

type Cart = Record<string, number>;

const GOALS = [
  { value: "all", label: "All" },
  { value: "weight_loss", label: "Weight Loss" },
  { value: "weight_gain", label: "Weight Gain" },
];

type TdeeForm = TdeeRequest & {
  mealsPerDay: number;
};

const DEFAULT_TDEE_FORM: TdeeForm = {
  age: 32,
  heightCm: 180,
  weightKg: 78,
  activityLevel: "moderate",
  goal: "recomposition",
  mealsPerDay: 4,
};

const TDEE_STORAGE_KEY = "hotel_fit_tdee_profile";

export default function MenuExperience() {
  const { brand, ready } = useBranding();
  const [tdeeForm, setTdeeForm] = useState<TdeeForm>(DEFAULT_TDEE_FORM);
  const [tdeeResult, setTdeeResult] = useState(() => calculateTDEE(DEFAULT_TDEE_FORM));
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [goalFilter, setGoalFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const updateTdeeForm = <K extends keyof TdeeForm>(field: K, value: TdeeForm[K]) => {
    setTdeeForm((prev) => {
      const next = { ...prev, [field]: value };
      setTdeeResult(calculateTDEE(next));
      return next;
    });
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const feedUrl = process.env.NEXT_PUBLIC_VHP_FEED_URL;
      const remoteItems = await fetchVhpMenuFeed(feedUrl);
      if (remoteItems.length) {
        setItems(
          remoteItems.map((item, index) => ({
            id: String(item.id ?? `vhp-${index}`),
            name: item.name,
            description: item.description ?? null,
            price_cents: item.price ? Math.round(Number(item.price) * 100) : 0,
            base_kcal: item.calories ?? null,
            protein_g: item.protein_g ?? null,
            carbs_g: item.carbs_g ?? null,
            fat_g: item.fat_g ?? null,
            category: item.category ?? null,
            image_url: item.image_url ?? undefined,
          }))
        );
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("menu_items")
        .select("id,name,description,price_cents,base_kcal,protein_g,carbs_g,fat_g,category,image_url")
        .order("category", { ascending: true });
      if (error || !data?.length) {
        setItems(PLACEHOLDER_ITEMS);
      } else {
        setItems(data);
      }
      setLoading(false);
    };
    load().catch(() => {
      setItems(PLACEHOLDER_ITEMS);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(TDEE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<TdeeForm>;
        const nextForm = { ...DEFAULT_TDEE_FORM, ...parsed };
        setTdeeForm(nextForm);
        setTdeeResult(calculateTDEE(nextForm));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TDEE_STORAGE_KEY, JSON.stringify(tdeeForm));
  }, [tdeeForm]);

  const perMealTarget = useMemo(() => {
    return Math.round((tdeeResult.calories ?? 0) / Math.max(1, tdeeForm.mealsPerDay));
  }, [tdeeResult, tdeeForm.mealsPerDay]);

  const getPortionMultiplier = useCallback(
    (item: MenuItem) => {
      const base = item.base_kcal ?? 0;
      if (!base) return 1;
      const raw = perMealTarget / base;
      const safe = Number.isFinite(raw) ? raw : 1;
      return Math.min(2, Math.max(0.5, safe));
    },
    [perMealTarget]
  );

  const filteredItems = useMemo(() => {
    if (goalFilter === "all") return items;
    return items.filter((item) => {
      const kcal = item.base_kcal ?? 0;
      if (goalFilter === "weight_loss") {
        return kcal <= 550;
      }
      return kcal >= 650;
    });
  }, [goalFilter, items]);

  const total = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const menuItem = items.find((item) => item.id === id);
      if (!menuItem) return sum;
      const scale = getPortionMultiplier(menuItem);
      return sum + qty * ((menuItem.price_cents ?? 0) / 100) * scale;
    }, 0);
  }, [cart, items, getPortionMultiplier]);

  const handleAdd = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const handleSubmit = async () => {
    if (Object.keys(cart).length === 0) {
      setStatus("Add an item before ordering.");
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      const payloadItems = Object.entries(cart)
        .map(([menuItemId, quantity]) => {
          const menuItem = items.find((entry) => entry.id === menuItemId);
          return {
            menuItemId,
            quantity,
            portionMultiplier: menuItem ? getPortionMultiplier(menuItem) : 1,
          };
        })
        .filter((entry) => entry.quantity > 0);

      const payload = {
        roomNumber: "Suite-000",
        items: payloadItems,
      };
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setCart({});
      setStatus("Order submitted to kitchen queue.");
    } catch (error) {
      console.error(error);
      setStatus("Unable to submit order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading…</div>;
  }

  return (
    <BrandScreen
      eyebrow="In-room Dining"
      title="Menu"
      description="Chef-crafted fuel matched to your training goal."
      backHref="/home"
      backLabel="Home"
    >
      <section className="mb-6 rounded-3xl border border-white/10 bg-black/35 p-5 text-sm text-slate-300">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Personalize portions</p>
            <p className="text-white">We scale each plate using your TDEE + meal count.</p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>Target day: {tdeeResult.calories} kcal</p>
            <p>Per meal: {perMealTarget} kcal</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Age
            <input
              type="number"
              value={tdeeForm.age}
              onChange={(event) => updateTdeeForm("age", Number(event.target.value) || DEFAULT_TDEE_FORM.age)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm outline-none"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Height (cm)
            <input
              type="number"
              value={tdeeForm.heightCm}
              onChange={(event) => updateTdeeForm("heightCm", Number(event.target.value) || DEFAULT_TDEE_FORM.heightCm)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm outline-none"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Weight (kg)
            <input
              type="number"
              value={tdeeForm.weightKg}
              onChange={(event) => updateTdeeForm("weightKg", Number(event.target.value) || DEFAULT_TDEE_FORM.weightKg)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm outline-none"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Meals per day
            <input
              type="number"
              min={2}
              max={6}
              value={tdeeForm.mealsPerDay}
              onChange={(event) => updateTdeeForm("mealsPerDay", Math.max(2, Number(event.target.value) || 4))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm outline-none"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Activity
            <select
              value={tdeeForm.activityLevel}
              onChange={(event) => updateTdeeForm("activityLevel", event.target.value as TdeeForm["activityLevel"])}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm outline-none"
            >
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Goal
            <select
              value={tdeeForm.goal}
              onChange={(event) => updateTdeeForm("goal", event.target.value as TdeeForm["goal"])}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm outline-none"
            >
              <option value="fat-loss">Fat Loss</option>
              <option value="recomposition">Recomposition</option>
              <option value="performance">Performance</option>
            </select>
          </label>
        </div>
      </section>

      <div className="mb-6 flex flex-wrap gap-3">
        {GOALS.map((goal) => (
          <button
            key={goal.value}
            onClick={() => setGoalFilter(goal.value)}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.35em] ${
              goalFilter === goal.value ? "bg-white/20 border-white/40" : "border-white/20 text-white/70"
            }`}
          >
            {goal.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-300">Loading menu…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredItems.map((item) => {
            const scale = getPortionMultiplier(item);
            const adjustedPrice = ((item.price_cents ?? 0) / 100) * scale;
            const adjustedKcal = Math.round((item.base_kcal ?? 0) * scale);
            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -4 }}
                className="rounded-3xl border border-white/10 bg-black/45 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
              >
                {item.image_url && (
                  <div
                    className="mb-4 h-40 w-full rounded-2xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.image_url})` }}
                    aria-label={item.name}
                  />
                )}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{item.name}</p>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{item.category ?? "Chef"}</p>
                  </div>
                  <p className="text-sm" style={{ color: brand.accent }}>
                    ${adjustedPrice.toFixed(2)}
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  {item.description ?? "Chef-crafted selection featuring seasonal produce."}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {adjustedKcal} kcal • {Math.round((item.protein_g ?? 0) * scale)}P • {Math.round((item.carbs_g ?? 0) * scale)}C •{" "}
                  {Math.round((item.fat_g ?? 0) * scale)}F
                </p>
                <p className="text-xs text-amber-200">Portion {scale.toFixed(2)}× of base serving to hit your target</p>
                <button
                  onClick={() => handleAdd(item.id)}
                  className="mt-4 rounded-2xl border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/80 transition hover:bg-white/10"
                >
                  Add
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <section className="mt-8 rounded-3xl border border-white/10 bg-black/45 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Order summary</h2>
            <p className="text-xs text-slate-400">
              Tap menu items to add to the cart. Targeting {perMealTarget} kcal per meal for {tdeeForm.goal.replace("-", " ")}.
            </p>
          </div>
          <p className="text-sm" style={{ color: brand.accent }}>
            Total ${total.toFixed(2)}
          </p>
        </div>

        {Object.keys(cart).length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Cart is empty.</p>
        ) : (
          <div className="mt-4 space-y-2 text-sm text-slate-200">
            {Object.entries(cart).map(([id, qty]) => {
              const item = items.find((entry) => entry.id === id);
              if (!item) return null;
              const scale = getPortionMultiplier(item);
              const linePrice = ((item.price_cents ?? 0) / 100) * scale * qty;
              return (
                <div key={id} className="flex items-center justify-between">
                  <span>
                    {item.name} × {qty} • {Math.round((item.base_kcal ?? 0) * scale)} kcal
                  </span>
                  <span>${linePrice.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-2xl bg-white/90 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-black transition hover:bg-white disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Order"}
          </button>
          {status && <p className="text-xs text-slate-400">{status}</p>}
        </div>
      </section>
    </BrandScreen>
  );
}

const PLACEHOLDER_ITEMS: MenuItem[] = [
  {
    id: "chef-bowl",
    name: "Chef's Reset Bowl",
    description: "Charred salmon · ancient grains · citrus miso",
    price_cents: 3200,
    base_kcal: 520,
    protein_g: 40,
    carbs_g: 35,
    fat_g: 18,
    category: "Fuel",
    image_url: "/assets/menu/reset-bowl.jpg",
  },
];
