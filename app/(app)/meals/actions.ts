"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import {
  removeMealImage,
  uploadMealPrimaryImage,
} from "@/lib/storage/meal-media";
import {
  createMealFormSchema,
  parseIngredientsJson,
} from "@/lib/validations/meals";
import { friendlySupabaseError } from "@/lib/supabase/db-error-message";

export type CreateMealResult =
  | { success: true; mealId: string }
  | { success: false; error: string };

export type ToggleSocialResult =
  | { ok: true; active: boolean }
  | { ok: false; error: string };

/**
 * Crée un repas (`meals`), téléverse éventuellement l’image (`meal-media`),
 * enregistre `meal_media`, puis ajoute un `meal_logs` pour aujourd’hui
 * afin que le tableau de bord reflète tout de suite l’apport.
 */
export async function createMeal(formData: FormData): Promise<CreateMealResult> {
  const imageEntry = formData.get("image");
  const imageFile =
    imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null;

  const ingredientsRaw = String(formData.get("ingredients") ?? "");

  const parsedFields = createMealFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    instructions: formData.get("instructions") ?? "",
    category: formData.get("category"),
    difficulty: formData.get("difficulty"),
    calories_per_serving: formData.get("calories_per_serving"),
    protein_g_per_serving: formData.get("protein_g_per_serving"),
    carbs_g_per_serving: formData.get("carbs_g_per_serving"),
    fat_g_per_serving: formData.get("fat_g_per_serving"),
  });

  if (!parsedFields.success) {
    return {
      success: false,
      error: parsedFields.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const ingredientsParsed = parseIngredientsJson(ingredientsRaw);
  if (!ingredientsParsed.ok) {
    return { success: false, error: ingredientsParsed.message };
  }

  const isPublic =
    String(formData.get("is_public") ?? "false").toLowerCase() === "true";

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Tu dois être connecté." };
  }

  const mealId = randomUUID();
  const today = format(new Date(), "yyyy-MM-dd");

  const d = parsedFields.data;

  let uploadedPath: string | null = null;

  if (imageFile) {
    const upload = await uploadMealPrimaryImage(supabase, {
      userId: user.id,
      mealId,
      file: imageFile,
    });
    if ("error" in upload) {
      return { success: false, error: friendlySupabaseError(upload.error) };
    }
    uploadedPath = upload.path;
  }

  const { error: mealError } = await supabase.from("meals").insert({
    id: mealId,
    owner_id: user.id,
    title: d.title,
    description: d.description ?? null,
    instructions: d.instructions ?? null,
    ingredients: ingredientsParsed.value,
    category: d.category,
    difficulty: d.difficulty,
    servings: 1,
    calories_per_serving: d.calories_per_serving,
    protein_g_per_serving: d.protein_g_per_serving,
    carbs_g_per_serving: d.carbs_g_per_serving,
    fat_g_per_serving: d.fat_g_per_serving,
    is_public: isPublic,
  });

  if (mealError) {
    if (uploadedPath) {
      await removeMealImage(supabase, uploadedPath);
    }
    return {
      success: false,
      error: friendlySupabaseError(`[meals] ${mealError.message}`),
    };
  }

  if (uploadedPath) {
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
        success: false,
        error: friendlySupabaseError(`[meal_media] ${mediaError.message}`),
      };
    }
  }

  const { error: logError } = await supabase.from("meal_logs").insert({
    user_id: user.id,
    logged_on: today,
    meal_id: mealId,
    servings_eaten: 1,
    calories: d.calories_per_serving,
    protein_g: d.protein_g_per_serving,
    carbs_g: d.carbs_g_per_serving,
    fat_g: d.fat_g_per_serving,
    source: "recipe",
  });

  if (logError) {
    await supabase.from("meals").delete().eq("id", mealId);
    if (uploadedPath) {
      await removeMealImage(supabase, uploadedPath);
    }
    return {
      success: false,
      error: friendlySupabaseError(`[meal_logs] ${logError.message}`),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/meals/new");
  revalidatePath(`/meals/${mealId}`);
  revalidatePath("/profile");
  if (isPublic) {
    revalidatePath("/meals/explore");
  }

  return { success: true, mealId };
}

/**
 * Ajoute ou retire un « like » sur un repas public (table `recipe_likes`).
 */
export async function toggleLikeMeal(mealId: string): Promise<ToggleSocialResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Tu dois être connecté." };
  }

  const { data: existing, error: selErr } = await supabase
    .from("recipe_likes")
    .select("meal_id")
    .eq("user_id", user.id)
    .eq("meal_id", mealId)
    .maybeSingle();

  if (selErr) {
    return { ok: false, error: friendlySupabaseError(selErr.message) };
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from("recipe_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("meal_id", mealId);
    if (delErr) {
      return { ok: false, error: friendlySupabaseError(delErr.message) };
    }
    revalidatePath("/meals/explore");
    revalidatePath(`/meals/${mealId}`);
    revalidatePath("/profile");
    return { ok: true, active: false };
  }

  const { error: insErr } = await supabase.from("recipe_likes").insert({
    user_id: user.id,
    meal_id: mealId,
  });
  if (insErr) {
    return { ok: false, error: friendlySupabaseError(insErr.message) };
  }
  revalidatePath("/meals/explore");
  revalidatePath(`/meals/${mealId}`);
  revalidatePath("/profile");
  return { ok: true, active: true };
}

/**
 * Ajoute ou retire un repas des favoris (table `recipe_saves`).
 */
export async function toggleSaveMeal(mealId: string): Promise<ToggleSocialResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Tu dois être connecté." };
  }

  const { data: existing, error: selErr } = await supabase
    .from("recipe_saves")
    .select("meal_id")
    .eq("user_id", user.id)
    .eq("meal_id", mealId)
    .maybeSingle();

  if (selErr) {
    return { ok: false, error: friendlySupabaseError(selErr.message) };
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from("recipe_saves")
      .delete()
      .eq("user_id", user.id)
      .eq("meal_id", mealId);
    if (delErr) {
      return { ok: false, error: friendlySupabaseError(delErr.message) };
    }
    revalidatePath("/meals/explore");
    revalidatePath(`/meals/${mealId}`);
    revalidatePath("/profile");
    return { ok: true, active: false };
  }

  const { error: insErr } = await supabase.from("recipe_saves").insert({
    user_id: user.id,
    meal_id: mealId,
  });
  if (insErr) {
    return { ok: false, error: friendlySupabaseError(insErr.message) };
  }
  revalidatePath("/meals/explore");
  revalidatePath(`/meals/${mealId}`);
  revalidatePath("/profile");
  return { ok: true, active: true };
}
