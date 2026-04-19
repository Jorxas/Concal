"use server";

import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { upsertDailyUserGoals } from "@/lib/db/user-goals-upsert";
import { estimateDailyTargets } from "@/lib/nutrition/estimate-daily-targets";
import { friendlySupabaseError } from "@/lib/supabase/db-error-message";
import { AVATARS_BUCKET, uploadUserAvatar } from "@/lib/storage/avatar";
import { bodyProfileFormSchema } from "@/lib/validations/body-profile";

export type UpdateAvatarState =
  | { ok: true }
  | { ok: false; error: string };

export type SaveNutritionProfileState =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Enregistre le profil anthropométrique et recalcule les objectifs du jour
 * (calories + macros) dans `user_goals`.
 */
export async function saveNutritionProfile(
  _prev: SaveNutritionProfileState | undefined,
  formData: FormData,
): Promise<SaveNutritionProfileState> {
  const parsed = bodyProfileFormSchema.safeParse({
    sex: formData.get("sex"),
    age_years: formData.get("age_years"),
    height_cm: formData.get("height_cm"),
    weight_kg: formData.get("weight_kg"),
    activity_sessions_per_week: formData.get("activity_sessions_per_week"),
    goal_type: formData.get("goal_type"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Tu dois être connecté." };
  }

  const p = parsed.data;
  const { error: profileErr } = await supabase.from("user_body_profile").upsert(
    {
      user_id: user.id,
      sex: p.sex,
      age_years: p.age_years,
      height_cm: p.height_cm,
      weight_kg: p.weight_kg,
      activity_sessions_per_week: p.activity_sessions_per_week,
      goal_type: p.goal_type,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (profileErr) {
    return {
      ok: false,
      error: friendlySupabaseError(`[user_body_profile] ${profileErr.message}`),
    };
  }

  const targets = estimateDailyTargets({
    sex: p.sex,
    ageYears: p.age_years,
    heightCm: p.height_cm,
    weightKg: p.weight_kg,
    activitySessionsPerWeek: p.activity_sessions_per_week,
    goalType: p.goal_type,
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const { error: goalErr } = await upsertDailyUserGoals(supabase, user.id, today, {
    target_calories: Math.round(targets.target_calories),
    target_protein_g: targets.target_protein_g,
    target_carbs_g: targets.target_carbs_g,
    target_fat_g: targets.target_fat_g,
  });

  if (goalErr) {
    return { ok: false, error: goalErr };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateProfileAvatar(
  _prev: UpdateAvatarState | undefined,
  formData: FormData,
): Promise<UpdateAvatarState> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choisis une image." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Tu dois être connecté." };
  }

  const upload = await uploadUserAvatar(supabase, {
    userId: user.id,
    file,
  });

  if ("error" in upload) {
    return { ok: false, error: upload.error };
  }

  const { error: metaError } = await supabase.auth.updateUser({
    data: {
      avatar_storage_path: upload.path,
    },
  });

  if (metaError) {
    return { ok: false, error: metaError.message };
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeProfileAvatar(): Promise<UpdateAvatarState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Tu dois être connecté." };
  }

  const path = user.user_metadata?.avatar_storage_path;
  if (typeof path === "string" && path.length > 0) {
    await supabase.storage.from(AVATARS_BUCKET).remove([path]);
  }

  const nextMeta = { ...(user.user_metadata ?? {}) } as Record<string, unknown>;
  delete nextMeta.avatar_storage_path;

  const { error: metaError } = await supabase.auth.updateUser({
    data: nextMeta,
  });

  if (metaError) {
    return { ok: false, error: metaError.message };
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}
