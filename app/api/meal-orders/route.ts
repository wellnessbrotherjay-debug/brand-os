import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type OrderItemInput = {
  menuItemId: string;
  quantity?: number;
  portionMultiplier?: number;
  adjustments?: {
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    kcal?: number;
  };
  notes?: string;
};

type MealOrderPayload = {
  roomId?: string;
  roomNumber?: string;
  guestName?: string;
  deliveryMethod?: "room" | "pickup" | "dine_in";
  items: OrderItemInput[];
  specialInstructions?: string;
};

const defaultMacros = () => ({
  kcal: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
});

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as MealOrderPayload;

    if (!payload?.items || payload.items.length === 0) {
      return NextResponse.json({ error: "No meal items supplied." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const itemIds = [...new Set(payload.items.map((item) => item.menuItemId))];

    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id,name,description,price_cents,base_kcal,protein_g,carbs_g,fat_g,base_macros,recipe_id")
      .in("id", itemIds);

    if (menuError) {
      console.error(menuError);
      return NextResponse.json({ error: "Unable to load menu items." }, { status: 500 });
    }

    if (!menuItems || menuItems.length !== itemIds.length) {
      return NextResponse.json({ error: "Some menu items were not found." }, { status: 400 });
    }

    const recipeIds = menuItems.map((item) => item.recipe_id).filter(Boolean);
    let recipeMap: Record<string, any> = {};

    if (recipeIds.length > 0) {
      const { data: recipes, error: recipeError } = await supabase
        .from("recipes")
        .select("id, title, description, instructions, ingredients, base_macros")
        .in("id", recipeIds as string[]);

      if (recipeError) {
        console.error(recipeError);
        return NextResponse.json({ error: "Unable to load recipes." }, { status: 500 });
      }

      recipeMap = Object.fromEntries((recipes ?? []).map((recipe) => [recipe.id, recipe]));
    }

    const itemsPayload = [];
    const recipeSnapshots = [];
    const totalMacros = defaultMacros();
    const macroAdjustments = defaultMacros();
    let totalCents = 0;

    for (const orderItem of payload.items) {
      const menuItem = menuItems.find((menu) => menu.id === orderItem.menuItemId);
      if (!menuItem) continue;

      const quantity = orderItem.quantity && orderItem.quantity > 0 ? orderItem.quantity : 1;
      const portionMultiplier = orderItem.portionMultiplier && orderItem.portionMultiplier > 0 ? orderItem.portionMultiplier : 1;
      const baseMacros = {
        kcal: Number(menuItem.base_kcal) || Number(menuItem.base_macros?.kcal) || 0,
        protein_g: Number(menuItem.protein_g) || Number(menuItem.base_macros?.protein_g) || 0,
        carbs_g: Number(menuItem.carbs_g) || Number(menuItem.base_macros?.carbs_g) || 0,
        fat_g: Number(menuItem.fat_g) || Number(menuItem.base_macros?.fat_g) || 0,
      };

      const adjustments = {
        kcal: orderItem.adjustments?.kcal ?? 0,
        protein_g: orderItem.adjustments?.protein_g ?? 0,
        carbs_g: orderItem.adjustments?.carbs_g ?? 0,
        fat_g: orderItem.adjustments?.fat_g ?? 0,
      };

      const portionScale = quantity * portionMultiplier;
      const lineMacros = {
        kcal: baseMacros.kcal * portionScale + adjustments.kcal,
        protein_g: baseMacros.protein_g * portionScale + adjustments.protein_g,
        carbs_g: baseMacros.carbs_g * portionScale + adjustments.carbs_g,
        fat_g: baseMacros.fat_g * portionScale + adjustments.fat_g,
      };

      totalMacros.kcal += lineMacros.kcal;
      totalMacros.protein_g += lineMacros.protein_g;
      totalMacros.carbs_g += lineMacros.carbs_g;
      totalMacros.fat_g += lineMacros.fat_g;

      macroAdjustments.kcal += adjustments.kcal;
      macroAdjustments.protein_g += adjustments.protein_g;
      macroAdjustments.carbs_g += adjustments.carbs_g;
      macroAdjustments.fat_g += adjustments.fat_g;

      const lineCents = Math.round((menuItem.price_cents ?? 0) * portionScale);
      totalCents += lineCents;

      itemsPayload.push({
        menu_item_id: menuItem.id,
        name: menuItem.name,
        quantity,
        portion_multiplier: portionMultiplier,
        notes: orderItem.notes ?? null,
        macros: lineMacros,
        adjustments,
        line_cents: lineCents,
      });

      if (menuItem.recipe_id) {
        const recipe = recipeMap[menuItem.recipe_id];
        recipeSnapshots.push({
          recipe_id: menuItem.recipe_id,
          name: recipe?.title ?? menuItem.name,
          instructions: recipe?.instructions,
          ingredients: recipe?.ingredients,
          macros: recipe?.base_macros ?? baseMacros,
        });
      }
    }

    if (itemsPayload.length === 0) {
      return NextResponse.json({ error: "Unable to create meal order from supplied items." }, { status: 400 });
    }

    const ticketRef = `MEAL-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 900 + 100)}`;

    const insertPayload = {
      room_number: payload.roomNumber ?? payload.roomId ?? null,
      guest_name: payload.guestName ?? null,
      delivery_method: payload.deliveryMethod ?? "room",
      status: "queued",
      total_cents: totalCents,
      macros: totalMacros,
      macro_adjustments: macroAdjustments,
      items: itemsPayload,
      recipe_snapshot: recipeSnapshots,
      special_instructions: payload.specialInstructions ?? null,
      ticket_ref: ticketRef,
    };

    const { data: order, error: insertError } = await supabase
      .from("meal_orders")
      .insert(insertPayload)
      .select("*")
      .single();

    if (insertError) {
      console.error(insertError);
      return NextResponse.json({ error: "Could not submit meal order." }, { status: 500 });
    }

    try {
      await supabase.from("kitchen_queue").insert({
        meal_order_id: order.id,
        user_id: order.user_id,
        room_number: order.room_number,
        guest_name: order.guest_name,
        status: order.status,
        meta: {
          delivery_method: order.delivery_method,
          items: order.items,
          macros: order.macros,
          ticket_ref: order.ticket_ref,
          total_cents: order.total_cents,
        },
      });
    } catch (err: any) {
      // If kitchen_queue doesn't exist (PGRST205) or any other insert fails,
      // log it and continue — the meal order itself was created successfully.
      console.warn('Failed to insert into kitchen_queue (table may be missing):', err?.message ?? err);
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected error creating meal order." }, { status: 500 });
  }
}
