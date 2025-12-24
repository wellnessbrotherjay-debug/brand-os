"use client";

import { useMemo, useState } from "react";
import type { MenuItem, Recipe } from "@/lib/types/meal";

type SelectedItem = {
  id: string;
  quantity: number;
  adjustments: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    kcal: number;
  };
};

type MenuItemWithRecipe = MenuItem & { recipe?: Recipe | null };

type Props = {
  roomId: string;
  menuItems: MenuItemWithRecipe[];
};

const categoriesOrder = ["breakfast", "pre", "post", "lunch", "dinner", "snack"];

const macroKeys: Array<keyof SelectedItem["adjustments"]> = ["kcal", "protein_g", "carbs_g", "fat_g"];
const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const formatPrice = (cents: number) => currencyFormatter.format((cents ?? 0) / 100);

const formatIngredient = (ingredient: Record<string, unknown>) => {
  const amount = ingredient.amount ? `${ingredient.amount}` : "";
  const unit = ingredient.unit ? ` ${ingredient.unit}` : "";
  const name = ingredient.name ?? ingredient.item ?? "Ingredient";
  return `${amount}${unit} ${name}`.trim();
};

export default function FoodOrderClient({ roomId, menuItems }: Props) {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groupedMenu = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    for (const item of menuItems) {
      const key = item.category ?? "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.name.localeCompare(b.name));
    }
    return groups;
  }, [menuItems]);

  const totals = useMemo(() => {
    return selectedItems.reduce(
      (acc, selected) => {
        const menuItem = menuItems.find((item) => item.id === selected.id);
        if (!menuItem) return acc;

        const base = {
          kcal: Number(menuItem.base_kcal) || Number(menuItem.base_macros?.kcal) || 0,
          protein_g: Number(menuItem.protein_g) || Number(menuItem.base_macros?.protein_g) || 0,
          carbs_g: Number(menuItem.carbs_g) || Number(menuItem.base_macros?.carbs_g) || 0,
          fat_g: Number(menuItem.fat_g) || Number(menuItem.base_macros?.fat_g) || 0,
        };

        acc.kcal += base.kcal * selected.quantity + selected.adjustments.kcal;
        acc.protein_g += base.protein_g * selected.quantity + selected.adjustments.protein_g;
        acc.carbs_g += base.carbs_g * selected.quantity + selected.adjustments.carbs_g;
        acc.fat_g += base.fat_g * selected.quantity + selected.adjustments.fat_g;
        acc.count += selected.quantity;
        acc.totalCents += (menuItem.price_cents ?? 0) * selected.quantity;
        return acc;
      },
      { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, count: 0, totalCents: 0 }
    );
  }, [menuItems, selectedItems]);

  const addItem = (menuItem: MenuItem) => {
    setStatusMessage(null);
    setSelectedItems((prev) => {
      const existing = prev.find((entry) => entry.id === menuItem.id);
      if (existing) {
        return prev.map((entry) =>
          entry.id === menuItem.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        );
      }

      return [
        ...prev,
        {
          id: menuItem.id,
          quantity: 1,
          adjustments: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((entry) =>
          entry.id === id ? { ...entry, quantity: Math.max(1, entry.quantity + delta) } : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  };

  const updateAdjustment = (id: string, field: keyof SelectedItem["adjustments"], value: number) => {
    setSelectedItems((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, adjustments: { ...entry.adjustments, [field]: value } } : entry
      )
    );
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      setStatusMessage("Add at least one menu item before sending to the kitchen.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/meal-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          roomNumber: roomId,
          items: selectedItems.map((item) => ({
            menuItemId: item.id,
            quantity: item.quantity,
            adjustments: item.adjustments,
          })),
          specialInstructions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create meal order.");
      }

      setStatusMessage(`Ticket ${data.order?.ticket_ref ?? data.order?.id} sent to kitchen.`);
      setSelectedItems([]);
      setSpecialInstructions("");
    } catch (error) {
      console.error(error);
      setStatusMessage((error as Error).message ?? "Failed to send order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row">
        <section className="flex-1 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-slate-400">
              In-Room Service
            </p>
            <h1 className="heading-font text-3xl text-white">Order Performance Meals</h1>
            <p className="mt-2 text-sm text-slate-400">
              Adjust macros, send to the kitchen, and keep training fuel dialed in.
            </p>
          </div>

          <div className="space-y-6">
            {(
              categoriesOrder.filter((category) => groupedMenu[category]) ??
              Object.keys(groupedMenu)
            ).map((category) => (
              <div key={category} className="space-y-4">
                <h2 className="text-xs uppercase tracking-[0.4em] text-slate-500">
                  {category}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {groupedMenu[category]?.map((item) => (
                    <div
                      key={item.id}
                      className="space-y-4 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur"
                    >
                      {item.image_url && (
                        <div className="h-36 w-full overflow-hidden rounded-2xl border border-white/10">
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-white">{item.name}</p>
                          <p className="text-xs text-slate-300">{item.description}</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-100">{formatPrice(item.price_cents)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-slate-300">
                        <Chip label={`${item.base_kcal} kcal`} />
                        <Chip label={`${item.protein_g}g P`} />
                        <Chip label={`${item.carbs_g}g C`} />
                        <Chip label={`${item.fat_g}g F`} />
                      </div>
                      {item.recipe && (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-slate-200">
                          <button
                            type="button"
                            onClick={() => setExpandedRecipeId((prev) => (prev === item.id ? null : item.id))}
                            className="flex w-full items-center justify-between text-left font-semibold text-white"
                          >
                            Chef Notes
                            <span className="text-[0.6rem] uppercase tracking-[0.3em] text-sky-200">
                              {expandedRecipeId === item.id ? "Hide" : "View"}
                            </span>
                          </button>
                          {expandedRecipeId === item.id && (
                            <div className="mt-2 space-y-1 text-slate-200/90">
                              {item.recipe.instructions && <p className="text-slate-300">{item.recipe.instructions}</p>}
                              {Array.isArray(item.recipe.ingredients) && item.recipe.ingredients.length > 0 && (
                                <div>
                                  <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-400">Ingredients</p>
                                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-200">
                                    {item.recipe.ingredients.slice(0, 4).map((ingredient, index) => (
                                      <li key={`${item.id}-ingredient-${index}`}>{formatIngredient(ingredient)}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        className="mt-2 w-full rounded-full border border-sky-400/60 bg-sky-500/10 px-3 py-2 text-xs uppercase tracking-[0.35em] text-sky-100 transition hover:bg-sky-500/30"
                        onClick={() => addItem(item)}
                      >
                        Add to Tray
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur">
          <h2 className="text-sm uppercase tracking-[0.45em] text-slate-400">Order Tray</h2>

          {selectedItems.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              Select menu items to build your order. Macros update in real time.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {selectedItems.map((item) => {
                const menuItem = menuItems.find((menu) => menu.id === item.id);
                if (!menuItem) return null;

                return (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{menuItem.name}</p>
                        <p className="text-xs text-slate-400">{menuItem.category}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="rounded-full border border-white/20 px-2"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="rounded-full border border-white/20 px-2"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      {macroKeys.map((macro) => (
                        <label key={macro} className="text-slate-400">
                          {macro === "kcal" ? "Calories" : macro.replace("_", " ").toUpperCase()}
                          <input
                            type="number"
                            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-white"
                            value={item.adjustments[macro]}
                            onChange={(event) =>
                              updateAdjustment(item.id, macro, Number(event.target.value) || 0)
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-slate-300">
            <div className="flex justify-between">
              <span>Items</span>
              <span>{totals.count}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Calories</span>
              <span>{Math.round(totals.kcal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Protein</span>
              <span>{Math.round(totals.protein_g)}g</span>
            </div>
            <div className="flex justify-between">
              <span>Carbs</span>
              <span>{Math.round(totals.carbs_g)}g</span>
            </div>
            <div className="flex justify-between">
              <span>Fat</span>
              <span>{Math.round(totals.fat_g)}g</span>
            </div>
            <div className="flex justify-between text-white font-semibold">
              <span>Total</span>
              <span>${(totals.totalCents / 100).toFixed(2)}</span>
            </div>
          </div>

          <label className="mt-6 block text-xs uppercase tracking-[0.4em] text-slate-400">
            Notes for kitchen
            <textarea
              value={specialInstructions}
              onChange={(event) => setSpecialInstructions(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-white"
              rows={3}
              placeholder="Allergy info, plating notes, macros target..."
            />
          </label>

          {statusMessage && (
            <p className="mt-3 text-sm text-sky-300">{statusMessage}</p>
          )}

          <button
            disabled={isSubmitting || selectedItems.length === 0}
            onClick={handleSubmit}
            className="mt-4 w-full rounded-full border border-emerald-400/80 bg-emerald-500/20 px-4 py-3 text-xs uppercase tracking-[0.4em] text-emerald-100 disabled:opacity-40"
          >
            {isSubmitting ? "Sending..." : "Send to Kitchen"}
          </button>

          <p className="mt-2 text-center text-[11px] uppercase tracking-[0.4em] text-slate-500">
            Room #{roomId}
          </p>
        </aside>
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/20 px-3 py-1 text-[0.65rem] tracking-[0.25em] text-slate-200">
      {label}
    </span>
  );
}
