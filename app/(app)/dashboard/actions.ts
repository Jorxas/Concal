"use server";

import { randomUUID } from "crypto";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { analyzeFoodFromInlineImage } from "@/lib/ai/analyze-food-server";
import { friendlySupabaseError } from "@/lib/supabase/db-error-message";
import {
  isDaySlot,
  mealCategoryForDaySlot,
  type DaySlot,
} from "@/lib/meals/day-slots";
import {
  removeMealImage,
  uploadMealPrimaryImage,
} from "@/lib/storage/meal-media";
import { upsertDailyUserGoals } from "@/lib/db/user-goals-upsert";
import { userGoalFormSchema } from "@/lib/validations/goals";

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

  const { error: goalErr } = await upsertDailyUserGoals(supabase, user.id, today, {
    target_calories: d.target_calories,
    target_protein_g: d.target_protein_g,
    target_carbs_g: d.target_carbs_g,
    target_fat_g: d.target_fat_g,
  });
  if (goalErr) {
    return { error: goalErr };
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

export type QuickSlotPhotoResult =
  | { ok: true }
  | { ok: false; error: string; code?: "gemini_quota" };

/**
 * Photo prise depuis un créneau : analyse IA, recette privée minimale + image, puis journal du jour.
 */
export async function setDaySlotFromQuickPhoto(
  formData: FormData,
): Promise<QuickSlotPhotoResult> {
  const slotRaw = String(formData.get("slot") ?? "").trim();
  if (!isDaySlot(slotRaw)) {
    return { ok: false, error: "Créneau invalide." };
  }
  const slot = slotRaw as DaySlot;

  const imageEntry = formData.get("image");
  const imageFile =
    imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null;
  if (!imageFile) {
    return { ok: false, error: "Choisis une photo." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Tu dois être connecté." };
  }

  const buf = Buffer.from(await imageFile.arrayBuffer());
  const mime = imageFile.type || "image/jpeg";
  const imageDataUrl = `data:${mime};base64,${buf.toString("base64")}`;

  const analyzed = await analyzeFoodFromInlineImage(imageDataUrl);
  if (!analyzed.ok) {
    if (analyzed.code === "gemini_quota") {
      return {
        ok: false,
        error: analyzed.error,
        code: "gemini_quota",
      };
    }
    return { ok: false, error: analyzed.error };
  }

  const a = analyzed.data;
  const caloriesRounded = Math.max(
    1,
    Math.round(Number.isFinite(a.calories) ? a.calories : 0),
  );
  const protein = Math.max(
    0,
    Math.min(2000, Number.isFinite(a.protein) ? a.protein : 0),
  );
  const carbs = Math.max(
    0,
    Math.min(2000, Number.isFinite(a.carbs) ? a.carbs : 0),
  );
  const fat = Math.max(0, Math.min(2000, Number.isFinite(a.fat) ? a.fat : 0));

  const ingredientsJson = a.ingredients.map((ing) => ({
    name: ing.name,
    amount: ing.amount || "",
    unit: ing.unit || "",
  }));

  const mealId = randomUUID();
  const today = format(new Date(), "yyyy-MM-dd");
  const category = mealCategoryForDaySlot(slot);

  let uploadedPath: string | null = null;

  const upload = await uploadMealPrimaryImage(supabase, {
    userId: user.id,
    mealId,
    file: imageFile,
  });
  if ("error" in upload) {
    return { ok: false, error: friendlySupabaseError(upload.error) };
  }
  uploadedPath = upload.path;

  const { error: mealError } = await supabase.from("meals").insert({
    id: mealId,
    owner_id: user.id,
    title: a.title.slice(0, 200),
    description: a.description.slice(0, 8000) || null,
    instructions: null,
    ingredients: ingredientsJson,
    category,
    difficulty: "easy",
    servings: 1,
    calories_per_serving: caloriesRounded,
    protein_g_per_serving: protein,
    carbs_g_per_serving: carbs,
    fat_g_per_serving: fat,
    is_public: false,
    cooking_video_url: null,
  });

  if (mealError) {
    await removeMealImage(supabase, uploadedPath);
    return {
      ok: false,
      error: friendlySupabaseError(`[meals] ${mealError.message}`),
    };
  }

  const { error: mediaError } = await supabase.from("meal_media").insert({
    meal_id: mealId,
    storage_path: uploadedPath,
    media_type: "image",
    sort_order: 0,
  });

  if (mediaError) {
    await supabase.from("meals").delete().eq("id", mealId);
    await removeMealImage(supabase, uploadedPath);
    return {
      ok: false,
      error: friendlySupabaseError(`[meal_media] ${mediaError.message}`),
    };
  }

  await supabase
    .from("meal_logs")
    .delete()
    .eq("user_id", user.id)
    .eq("logged_on", today)
    .eq("day_slot", slot);

  const { error: logErr } = await supabase.from("meal_logs").insert({
    user_id: user.id,
    logged_on: today,
    day_slot: slot,
    meal_id: mealId,
    servings_eaten: 1,
    calories: caloriesRounded,
    protein_g: protein,
    carbs_g: carbs,
    fat_g: fat,
    source: "recipe",
  });

  if (logErr) {
    await supabase.from("meal_media").delete().eq("meal_id", mealId);
    await supabase.from("meals").delete().eq("id", mealId);
    await removeMealImage(supabase, uploadedPath);
    return {
      ok: false,
      error: friendlySupabaseError(`[meal_logs] ${logErr.message}`),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/meals/new");
  revalidatePath("/profile");
  revalidatePath(`/meals/${mealId}`);
  return { ok: true };
}
