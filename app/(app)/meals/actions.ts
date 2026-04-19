"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
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

export type ToggleMealVisibilityResult =
  | { success: true; isPublic: boolean }
  | { success: false; error: string };

/**
 * Crée une recette (`meals`) et éventuellement l’image (`meal_media`).
 * Le journal du jour se remplit depuis le tableau de bord (4 moments), pas ici.
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
    cooking_video_url: formData.get("cooking_video_url"),
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
    cooking_video_url: d.cooking_video_url,
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
 * Met à jour un repas existant (même schéma que la création + `meal_id` dans le FormData).
 * Optionnel : nouvelle image (remplace l’ancienne dans Storage + `meal_media`).
 */
export async function updateMeal(formData: FormData): Promise<CreateMealResult> {
  const mealId = String(formData.get("meal_id") ?? "").trim();
  if (!mealId) {
    return { success: false, error: "Repas invalide." };
  }

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
    cooking_video_url: formData.get("cooking_video_url"),
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

  const { data: existing, error: existErr } = await supabase
    .from("meals")
    .select("id, owner_id, is_public")
    .eq("id", mealId)
    .maybeSingle();

  if (existErr || !existing || existing.owner_id !== user.id) {
    return { success: false, error: "Repas introuvable ou accès refusé." };
  }

  const wasPublic = Boolean(existing.is_public);
  const d = parsedFields.data;
  let uploadedPath: string | null = null;
  const oldPaths: string[] = [];

  if (imageFile) {
    const { data: mediaRows } = await supabase
      .from("meal_media")
      .select("storage_path")
      .eq("meal_id", mealId);
    for (const row of mediaRows ?? []) {
      if (row.storage_path) oldPaths.push(row.storage_path);
    }

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

  const { error: mealError } = await supabase
    .from("meals")
    .update({
      title: d.title,
      description: d.description ?? null,
      instructions: d.instructions ?? null,
      ingredients: ingredientsParsed.value,
      category: d.category,
      difficulty: d.difficulty,
      calories_per_serving: d.calories_per_serving,
      protein_g_per_serving: d.protein_g_per_serving,
      carbs_g_per_serving: d.carbs_g_per_serving,
      fat_g_per_serving: d.fat_g_per_serving,
      is_public: isPublic,
      cooking_video_url: d.cooking_video_url,
    })
    .eq("id", mealId)
    .eq("owner_id", user.id);

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
    await supabase.from("meal_media").delete().eq("meal_id", mealId);
    for (const p of oldPaths) {
      await removeMealImage(supabase, p);
    }
    const { error: mediaError } = await supabase.from("meal_media").insert({
      meal_id: mealId,
      storage_path: uploadedPath,
      media_type: "image",
      sort_order: 0,
    });
    if (mediaError) {
      await removeMealImage(supabase, uploadedPath);
      return {
        success: false,
        error: friendlySupabaseError(`[meal_media] ${mediaError.message}`),
      };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/meals/new");
  revalidatePath(`/meals/${mealId}`);
  revalidatePath(`/meals/${mealId}/edit`);
  revalidatePath("/profile");
  if (isPublic || wasPublic) {
    revalidatePath("/meals/explore");
  }

  return { success: true, mealId };
}

/**
 * Bascule la visibilité d’une recette (propriétaire uniquement), sans passer par l’édition.
 */
export async function toggleMealVisibility(
  mealId: string,
): Promise<ToggleMealVisibilityResult> {
  const id = mealId.trim();
  if (!id) {
    return { success: false, error: "Repas invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Tu dois être connecté." };
  }

  const { data: existing, error: existErr } = await supabase
    .from("meals")
    .select("id, owner_id, is_public")
    .eq("id", id)
    .maybeSingle();

  if (existErr || !existing || existing.owner_id !== user.id) {
    return { success: false, error: "Repas introuvable ou accès refusé." };
  }

  const wasPublic = Boolean(existing.is_public);
  const isPublic = !wasPublic;

  const { error: updErr } = await supabase
    .from("meals")
    .update({ is_public: isPublic })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (updErr) {
    return {
      success: false,
      error: friendlySupabaseError(`[meals] ${updErr.message}`),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/meals/new");
  revalidatePath(`/meals/${id}`);
  revalidatePath(`/meals/${id}/edit`);
  revalidatePath("/profile");
  if (isPublic || wasPublic) {
    revalidatePath("/meals/explore");
  }

  return { success: true, isPublic };
}

export type DeleteMealResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Supprime un repas et les lignes liées (médias, likes, favoris, logs du repas).
 */
export async function deleteMeal(mealId: string): Promise<DeleteMealResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Tu dois être connecté." };
  }

  const { data: meal, error: mealSelErr } = await supabase
    .from("meals")
    .select("id, owner_id")
    .eq("id", mealId)
    .maybeSingle();

  if (mealSelErr || !meal || meal.owner_id !== user.id) {
    return { success: false, error: "Repas introuvable ou accès refusé." };
  }

  const { data: mediaRows } = await supabase
    .from("meal_media")
    .select("storage_path")
    .eq("meal_id", mealId);

  for (const row of mediaRows ?? []) {
    if (row.storage_path) {
      await removeMealImage(supabase, row.storage_path);
    }
  }

  await supabase.from("meal_media").delete().eq("meal_id", mealId);
  await supabase.from("recipe_likes").delete().eq("meal_id", mealId);
  await supabase.from("recipe_saves").delete().eq("meal_id", mealId);
  await supabase.from("meal_logs").delete().eq("meal_id", mealId);

  const { error: delErr } = await supabase
    .from("meals")
    .delete()
    .eq("id", mealId)
    .eq("owner_id", user.id);

  if (delErr) {
    return { success: false, error: friendlySupabaseError(delErr.message) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/meals/new");
  revalidatePath("/meals/explore");
  revalidatePath("/profile");
  revalidatePath(`/meals/${mealId}`);
  revalidatePath(`/meals/${mealId}/edit`);

  return { success: true };
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
