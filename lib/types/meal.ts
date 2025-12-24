export type Recipe = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  ingredients: Array<Record<string, unknown>>;
  base_macros: Record<string, number>;
};

export type MenuItem = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  image_url?: string | null;
  price_cents: number;
  base_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  base_macros: Record<string, number> | null;
  recipe_id: string | null;
  recipe?: Recipe | null;
};

export type MealOrderItem = {
  menu_item_id: string;
  name: string;
  quantity: number;
  macros: Record<string, number>;
  adjustments?: Record<string, number>;
  line_cents: number;
};

export type MealOrder = {
  id: string;
  room_number: string | null;
  guest_name: string | null;
  status: string;
  delivery_method: string;
  ticket_ref: string | null;
  total_cents: number;
  macros: Record<string, number>;
  macro_adjustments: Record<string, number>;
  recipe_snapshot: Array<Record<string, unknown>>;
  items: MealOrderItem[];
  created_at: string;
};
