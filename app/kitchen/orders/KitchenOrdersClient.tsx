"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { MealOrder } from "@/lib/types/meal";

type Props = {
  initialOrders: MealOrder[];
};

const statusStyles: Record<string, string> = {
  queued: "text-amber-300 bg-amber-500/10 border-amber-500/30",
  in_kitchen: "text-sky-200 bg-sky-500/10 border-sky-500/40",
  ready: "text-emerald-200 bg-emerald-500/10 border-emerald-500/40",
  delivered: "text-slate-300 bg-slate-500/10 border-slate-500/30",
  cancelled: "text-rose-300 bg-rose-500/10 border-rose-500/40",
};

export default function KitchenOrdersClient({ initialOrders }: Props) {
  const [orders, setOrders] = useState<MealOrder[]>(initialOrders);

  type QueuePayload = {
    id: string;
    meal_order_id: string | null;
    room_number: string | null;
    guest_name: string | null;
    status: string;
    meta: Record<string, any> | null;
    created_at: string;
  };

  const normalizeQueuePayload = (row: QueuePayload): MealOrder => ({
    id: row.meal_order_id ?? row.id,
    room_number: row.room_number,
    guest_name: row.guest_name,
    status: row.status,
    delivery_method: row.meta?.delivery_method ?? "room",
    ticket_ref: row.meta?.ticket_ref ?? null,
    total_cents: row.meta?.total_cents ?? 0,
    macros: row.meta?.macros ?? {},
    macro_adjustments: row.meta?.macro_adjustments ?? {},
    recipe_snapshot: [],
    items: row.meta?.items ?? [],
    created_at: row.created_at,
  });

  useEffect(() => {
    const channel = supabase
      .channel("kitchen-queue-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kitchen_queue" },
        (payload) => {
          setOrders((prev) => {
            if (payload.eventType === "INSERT" && payload.new) {
              return [normalizeQueuePayload(payload.new as QueuePayload), ...prev].slice(0, 50);
            }

            if (payload.eventType === "UPDATE" && payload.new) {
              const nextOrder = normalizeQueuePayload(payload.new as QueuePayload);
              return prev.map((order) => (order.id === nextOrder.id ? nextOrder : order));
            }

            if (payload.eventType === "DELETE" && payload.old) {
              const removed = payload.old as QueuePayload;
              const removedId = removed.meal_order_id ?? removed.id;
              return prev.filter((order) => order.id !== removedId);
            }

            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const groupedOrders = useMemo(() => {
    const buckets: Record<string, MealOrder[]> = {
      queued: [],
      in_kitchen: [],
      ready: [],
      delivered: [],
      cancelled: [],
    };
    for (const order of orders) {
      const key = (order.status ?? "queued") as keyof typeof buckets;
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(order);
    }
    return buckets;
  }, [orders]);

  return (
    <div className="space-y-6">
      {["queued", "in_kitchen", "ready", "delivered"].map((status) => (
        <section key={status} className="rounded-2xl border border-white/10 bg-black/40 shadow-xl">
          <header className="flex items-center justify-between border-b border-white/5 px-6 py-3">
            <div className="text-xs uppercase tracking-[0.35em] text-slate-400">{status.replace("_", " ")}</div>
            <div className="text-sm text-slate-300">{groupedOrders[status]?.length ?? 0} tickets</div>
          </header>
          <div className="divide-y divide-white/5">
            {groupedOrders[status]?.length ? (
              groupedOrders[status].map((order) => (
                <article key={order.id} className="grid grid-cols-5 gap-4 px-6 py-4 text-sm text-slate-100">
                  <div>
                    <p className="font-mono text-slate-300">{order.ticket_ref ?? order.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleTimeString()}</p>
                  </div>
                  <div>
                    <p>Room {order.room_number ?? "?"}</p>
                    <p className="text-xs text-slate-400">{order.guest_name ?? "Anonymous"}</p>
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[order.status] ?? statusStyles.queued}`}>
                      {order.status.replace("_", " ")}
                    </span>
                    <p className="mt-2 text-xs text-slate-400 capitalize">{order.delivery_method}</p>
                  </div>
                  <div className="text-xs text-slate-300">
                    {order.items?.map((item) => (
                      <p key={item.menu_item_id}>
                        {item.quantity} × {item.name}
                      </p>
                    ))}
                  </div>
                  <div className="text-right text-xs text-slate-300">
                    <p>{Math.round(order.macros?.kcal ?? 0)} kcal</p>
                    <p>P{Math.round(order.macros?.protein_g ?? 0)} C{Math.round(order.macros?.carbs_g ?? 0)} F{Math.round(order.macros?.fat_g ?? 0)}</p>
                    <p className="mt-1 font-semibold text-white">${((order.total_cents ?? 0) / 100).toFixed(2)}</p>
                  </div>
                </article>
              ))
            ) : (
              <div className="px-6 py-6 text-center text-sm text-slate-500">No tickets in this lane.</div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
