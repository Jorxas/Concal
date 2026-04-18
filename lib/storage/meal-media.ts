import type { SupabaseClient } from "@supabase/supabase-js";

/** Bucket Supabase Storage pour les photos de repas (à créer côté projet si besoin). */
export const MEAL_MEDIA_BUCKET = "meal-media";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export type UploadMealImageResult =
  | { path: string }
  | { error: string };

/**
 * Téléverse une image de repas dans `meal-media/{userId}/{mealId}/photo.{ext}`.
 * Utilise le client Supabase authentifié (RLS / policies Storage applicables).
 */
export async function uploadMealPrimaryImage(
  supabase: SupabaseClient,
  params: { userId: string; mealId: string; file: File },
): Promise<UploadMealImageResult> {
  const { userId, mealId, file } = params;

  if (!file || file.size === 0) {
    return { error: "Fichier vide." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "Image trop volumineuse (maximum 5 Mo)." };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return {
      error: "Format d’image non supporté (JPEG, PNG, WebP ou GIF).",
    };
  }

  const ext = extensionForMime(file.type);
  const objectPath = `${userId}/${mealId}/photo.${ext}`;

  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(MEAL_MEDIA_BUCKET)
    .upload(objectPath, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    return {
      error:
        error.message ||
        "Échec du téléversement. Vérifie que le bucket « meal-media » existe et que les policies Storage sont configurées.",
    };
  }

  return { path: objectPath };
}

/**
 * Supprime un objet du bucket (nettoyage en cas d’erreur après insertion partielle).
 */
export async function removeMealImage(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<void> {
  await supabase.storage.from(MEAL_MEDIA_BUCKET).remove([storagePath]);
}

/**
 * URL signée pour afficher une image (bucket privé). Retourne `null` si échec.
 */
export async function getSignedMealImageUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(MEAL_MEDIA_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
}
