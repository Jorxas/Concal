"use server";

import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlySupabaseError } from "@/lib/supabase/db-error-message";
import { userGoalFormSchema } from "@/lib/validations/goals";
import { isDaySlot } from "@/lib/meals/day-slots";

export type DaySlotActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type UpsertGoalsResult = { error: string | null };

export async function upsertUserGoals(
  _prev: unknown,
  formData: FormData,
): Promise<UpsertGoalsResult> {
  const parsed = userGoalFormSchema.safeParse({
    target_calories: formData.get("target_calories"),
    target_protein_g: formData.get("target_protein_g"),
    target_carbs_g: formData.get("target_carbs_g"),
    target_fat_g: formData.get("target_fat_g"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Tu dois être connecté." };
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const d = parsed.data;

  const { data: existing, error: selErr } = await supabase
    .from("user_goals")
    .select("id")
    .eq("user_id", user.id)
    .eq("effective_from", today)
    .maybeSingle();

  if (selErr) {
    return { error: friendlySupabaseError(selErr.message) };
  }

  if (existing?.id) {
    const { error: updErr } = await supabase
      .from("user_goals")
      .update({
        target_calories: d.target_calories,
        target_protein_g: d.target_protein_g,
        target_carbs_g: d.target_carbs_g,
        target_fat_g: d.target_fat_g,
      })
      .eq("id", existing.id)
      .eq("user_id", user.id);

    if (updErr) {
      return { error: friendlySupabaseError(`[user_goals] ${updErr.message}`) };
    }
  } else {
    const { error: insErr } = await supabase.from("user_goals").insert({
      user_id: user.id,
      effective_from: today,
      target_calories: d.target_calories,
      target_protein_g: d.target_protein_g,
      target_carbs_g: d.target_carbs_g,
      target_fat_g: d.target_fat_g,
    });

    if (insErr) {
      return { error: friendlySupabaseError(`[user_goals] ${insErr.message}`) };
    }
  }

  revalidatePath("/dashboard");
  return { error: null };
}

function num(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Associe une recette à un créneau du jour (remplace l’entrée existante pour ce créneau).
 */
export async function setDaySlotMeal(
  slot: string,
  mealId: string,
): Promise<DaySlotActionResult> {
  if (!isDaySlot(slot)) {
    return { ok: false, error: "Créneau invalide." };
  }
  const id = mealId.trim();
  if (!id) {
    return { ok: false, error: "Recette invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Tu dois être connecté." };
  }

  const { data: meal, error: mealErr } = await supabase
    .from("meals")
    .select(
      "id, owner_id, is_public, calories_per_serving, protein_g_per_serving, carbs_g_per_serving, fat_g_per_serving",
    )
    .eq("id", id)
    .maybeSingle();

  if (mealErr || !meal) {
    return { ok: false, error: "Recette introuvable." };
  }

  if (meal.owner_id !== user.id && !meal.is_public) {
    return { ok: false, error: "Tu ne peux pas utiliser cette recette ici." };
  }

  const today = format(new Date(), "yyyy-MM-dd");

  await supabase
    .from("meal_logs")
    .delete()
    .eq("user_id", user.id)
    .eq("logged_on", today)
    .eq("day_slot", slot);

  const { error: insErr } = await supabase.from("meal_logs").insert({
    user_id: user.id,
    logged_on: today,
    day_slot: slot,
    meal_id: id,
    servings_eaten: 1,
    calories: num(meal.calories_per_serving),
    protein_g: num(meal.protein_g_per_serving),
    carbs_g: num(meal.carbs_g_per_serving),
    fat_g: num(meal.fat_g_per_serving),
    source: "recipe",
  });

  if (insErr) {
    return { ok: false, error: friendlySupabaseError(`[meal_logs] ${insErr.message}`) };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Vide un créneau du jour (retire la recette du journal pour ce moment).
 */
export async function clearDaySlot(slot: string): Promise<DaySlotActionResult> {
  if (!isDaySlot(slot)) {
    return { ok: false, error: "Créneau invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Tu dois être connecté." };
  }

  const today = format(new Date(), "yyyy-MM-dd");

  const { error } = await supabase
    .from("meal_logs")
    .delete()
    .eq("user_id", user.id)
    .eq("logged_on", today)
    .eq("day_slot", slot);

  if (error) {
    return { ok: false, error: friendlySupabaseError(error.message) };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
