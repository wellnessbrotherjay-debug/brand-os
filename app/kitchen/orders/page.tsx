import Link from "next/link";
export const dynamic = 'force-dynamic';
import { createAdminClient } from "@/lib/supabase/server";
import KitchenOrdersClient from "./KitchenOrdersClient";
import type { MealOrder } from "@/lib/types/meal";
import MainLayout from "@/components/MainLayout";
import { NexusCard } from "@/components/ui/NexusCard";

type QueueRow = {
  id: string;
  meal_order_id: string | null;
  room_number: string | null;
  guest_name: string | null;
  status: string;
  priority: string | null;
  meta: Record<string, any> | null;
  created_at: string;
  meal_order: MealOrder | null;
};

export default async function KitchenOrdersPage() {
  const supabase = createAdminClient();
  const { data: queue, error } = await supabase
    .from("kitchen_queue")
    .select(
      "id, meal_order_id, room_number, guest_name, status, priority, meta, created_at, meal_order:meal_order_id (id, room_number, guest_name, status, delivery_method, ticket_ref, total_cents, macros, macro_adjustments, items, recipe_snapshot, created_at)"
    )
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    console.error(error);
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white flex items-center justify-center">
        <div className="text-red-500 text-center mt-10">
          Unable to load kitchen queue. Please check Supabase connection or table name.
          <div className="mt-3 text-sm text-slate-400">
            Hint: If you recently ran migrations, ensure the `kitchen_queue` table exists in the connected Supabase project and that your
            <code className="mx-1">.env.local</code> points to the same project. Run the migration file <code>supabase/migrations/20251116093000_brand_theme_and_queue.sql</code>
            in the Supabase SQL editor if needed.
          </div>
        </div>
      </div>
    );
  }

  const normalizedOrders: MealOrder[] = queue?.map((t: any) => {
    const ticket = t as QueueRow;
    const base = ticket.meal_order ?? ({} as Partial<MealOrder>);
    const meta = ticket.meta ?? {};
    return {
      id: base.id ?? ticket.meal_order_id ?? ticket.id,
      room_number: base.room_number ?? ticket.room_number ?? meta.room_number ?? null,
      guest_name: base.guest_name ?? ticket.guest_name ?? meta.guest_name ?? null,
      status: ticket.status ?? base.status ?? "queued",
      delivery_method: base.delivery_method ?? meta.delivery_method ?? "room",
      ticket_ref: base.ticket_ref ?? meta.ticket_ref ?? null,
      total_cents: base.total_cents ?? meta.total_cents ?? 0,
      macros: base.macros ?? meta.macros ?? {},
      macro_adjustments: base.macro_adjustments ?? {},
      recipe_snapshot: base.recipe_snapshot ?? [],
      items: base.items ?? meta.items ?? [],
      created_at: base.created_at ?? ticket.created_at,
    } as MealOrder;
  }) ?? [];

  return (
    <MainLayout title="Kitchen Orders" subtitle="Food Ops">
      <div className="mx-auto max-w-6xl space-y-6">
        <NexusCard className="p-6 text-center">
          <p className="text-sm text-slate-300">
            Monitor hotel meal tickets and synchronize with in-room ordering.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs uppercase tracking-[0.3em]">
            <Link href="/room/preview" className="rounded-full border border-sky-400/50 px-4 py-2 text-sky-100 hover:bg-sky-500/10">
              Room Screens
            </Link>
            <Link href={`/room/demo/food`} className="rounded-full border border-emerald-400/50 px-4 py-2 text-emerald-100 hover:bg-emerald-500/10">
              Demo Ordering
            </Link>
          </div>
        </NexusCard>

        <NexusCard className="p-0">
          <KitchenOrdersClient initialOrders={normalizedOrders} />
        </NexusCard>
      </div>
    </MainLayout>
  );
}
