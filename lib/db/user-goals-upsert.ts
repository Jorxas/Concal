import type { SupabaseClient } from "@supabase/supabase-js";
import { friendlySupabaseError } from "@/lib/supabase/db-error-message";

export type DailyGoalTargets = {
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
};

/** Met à jour ou crée la ligne `user_goals` pour `effective_from` (date YYYY-MM-DD). */
export async function upsertDailyUserGoals(
  supabase: SupabaseClient,
  userId: string,
  effectiveFrom: string,
  targets: DailyGoalTargets,
): Promise<{ error: string | null }> {
  const { data: existing, error: selErr } = await supabase
    .from("user_goals")
    .select("id")
    .eq("user_id", userId)
    .eq("effective_from", effectiveFrom)
    .maybeSingle();

  if (selErr) {
    return { error: friendlySupabaseError(selErr.message) };
  }

  if (existing?.id) {
    const { error: updErr } = await supabase
      .from("user_goals")
      .update({
        target_calories: targets.target_calories,
        target_protein_g: targets.target_protein_g,
        target_carbs_g: targets.target_carbs_g,
        target_fat_g: targets.target_fat_g,
      })
      .eq("id", existing.id)
      .eq("user_id", userId);

    if (updErr) {
      return { error: friendlySupabaseError(`[user_goals] ${updErr.message}`) };
    }
    return { error: null };
  }

  const { error: insErr } = await supabase.from("user_goals").insert({
    user_id: userId,
    effective_from: effectiveFrom,
    target_calories: targets.target_calories,
    target_protein_g: targets.target_protein_g,
    target_carbs_g: targets.target_carbs_g,
    target_fat_g: targets.target_fat_g,
  });

  if (insErr) {
    return { error: friendlySupabaseError(`[user_goals] ${insErr.message}`) };
  }
  return { error: null };
}
