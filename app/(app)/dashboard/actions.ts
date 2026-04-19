"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { friendlySupabaseError } from "@/lib/supabase/db-error-message";
import { userGoalFormSchema } from "@/lib/validations/goals";

export type UpsertGoalsState = {
  error?: string;
  success?: boolean;
};

/**
 * Crée ou met à jour les objectifs du jour (`effective_from` = date du serveur).
 */
export async function upsertUserGoals(
  _prev: UpsertGoalsState | undefined,
  formData: FormData,
): Promise<UpsertGoalsState> {
  const raw = {
    target_calories: formData.get("target_calories"),
    target_protein_g: formData.get("target_protein_g"),
    target_carbs_g: formData.get("target_carbs_g"),
    target_fat_g: formData.get("target_fat_g"),
  };

  const parsed = userGoalFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Tu dois être connecté pour enregistrer tes objectifs." };
  }

  const effectiveFrom = format(new Date(), "yyyy-MM-dd");

  const { error } = await supabase.from("user_goals").upsert(
    {
      user_id: user.id,
      effective_from: effectiveFrom,
      target_calories: parsed.data.target_calories,
      target_protein_g: parsed.data.target_protein_g,
      target_carbs_g: parsed.data.target_carbs_g,
      target_fat_g: parsed.data.target_fat_g,
    },
    { onConflict: "user_id,effective_from" },
  );

  if (error) {
    return { error: friendlySupabaseError(error.message) };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
