/** Remplace le message Postgres brut par une consigne exploitable pour l’utilisateur. */
export function friendlySupabaseError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("row-level security") || m.includes("rls policy")) {
    return "Sécurité base (RLS) : exécute dans Supabase → SQL le fichier 20260419120000_meals_meal_media_meal_logs_rls.sql (dossier supabase/migrations). Si likes ou objectifs bloquent, exécute aussi …120001_recipe_social_user_goals_rls.sql.";
  }
  return message;
}
