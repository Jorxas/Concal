/** Remplace le message Postgres brut par une consigne exploitable pour l’utilisateur. */
export function friendlySupabaseError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("row-level security") || m.includes("rls policy")) {
    return "Sécurité base (RLS) : dans Supabase → SQL Editor, exécute tout le fichier supabase/migrations/20260419120000_meals_meal_media_meal_logs_rls.sql (pull le dépôt pour la dernière version). Puis …120001… si likes/objectifs bloquent. Le préfixe [meals]/[meal_media]/[meal_logs] indique quelle table a refusé.";
  }
  return message;
}
