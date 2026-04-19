import { MEAL_CATEGORIES } from "@/lib/validations/meals";

export const DAY_SLOTS = ["breakfast", "lunch", "snack", "dinner"] as const;

export type DaySlot = (typeof DAY_SLOTS)[number];

export type MealCategory = (typeof MEAL_CATEGORIES)[number];

export function isDaySlot(value: string): value is DaySlot {
  return (DAY_SLOTS as readonly string[]).includes(value);
}

const SLOT_TO_MEAL_CATEGORY: Record<DaySlot, MealCategory> = {
  breakfast: "breakfast",
  lunch: "lunch",
  dinner: "dinner",
  snack: "snack",
};

/** Catégorie recette cohérente avec le créneau journalier choisi. */
export function mealCategoryForDaySlot(slot: DaySlot): MealCategory {
  return SLOT_TO_MEAL_CATEGORY[slot];
}
