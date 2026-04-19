/** Remplace le message Postgres brut par une consigne exploitable pour l’utilisateur. */
export function friendlySupabaseError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("row-level security") || m.includes("rls policy")) {
    return "Sécurité RLS : 1) tables repas → exécute 20260419120000_meals_meal_media_meal_logs_rls.sql puis 20260419120001… si besoin. 2) photo repas / storage → exécute 20260419150000_storage_meal_media_avatars.sql (l’avertissement « destructive » dans l’éditeur SQL est normal). Préfixes [meals]/[meal_media]/[meal_logs] = table concernée.";
  }
  if (m.includes("day_slot")) {
    return "Colonne manquante : exécute supabase/migrations/20260421120000_meal_logs_day_slot.sql dans l’éditeur SQL Supabase.";
  }
  return message;
}
