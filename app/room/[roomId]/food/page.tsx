import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import FoodOrderClient from "./FoodOrderClient";
import type { MenuItem } from "@/lib/types/meal";

type FoodPageProps = {
  params: { roomId: string };
};

export default async function RoomFoodPage({ params }: FoodPageProps) {
  const supabase = createAdminClient();
  const { data: menuItems, error } = await supabase
    .from("menu_items")
    .select(
      `
      id,
      category,
      name,
      description,
      image_url,
      price_cents,
      base_kcal,
      protein_g,
      carbs_g,
      fat_g,
      base_macros,
      recipe:recipe_id (
        id,
        slug,
        title,
        description,
        instructions,
        ingredients,
        base_macros
      )
    `
    )
    .order("category");

  if (error) {
    console.error(error);
    throw new Error("Unable to load the menu right now.");
  }

  if (!menuItems) {
    return notFound();
  }

  return (
    <FoodOrderClient
      roomId={params.roomId}
      menuItems={menuItems as MenuItem[]}
    />
  );
}
