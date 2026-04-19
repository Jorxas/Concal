import type { SupabaseClient } from "@supabase/supabase-js";

export const AVATARS_BUCKET = "avatars";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function extFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export type AvatarUploadResult = { path: string } | { error: string };

export async function uploadUserAvatar(
  supabase: SupabaseClient,
  params: { userId: string; file: File },
): Promise<AvatarUploadResult> {
  const { userId, file } = params;
  if (!file || file.size === 0) return { error: "Fichier vide." };
  if (file.size > MAX_BYTES) {
    return { error: "Image trop volumineuse (maximum 2 Mo)." };
  }
  if (!ALLOWED.has(file.type)) {
    return { error: "Format non supporté (JPEG, PNG ou WebP)." };
  }

  const ext = extFor(file.type);
  const path = `${userId}/avatar.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    return {
      error:
        error.message ||
        "Échec du téléversement. Vérifie le bucket « avatars » et les politiques Storage (fichier SQL storage du dépôt).",
    };
  }

  return { path };
}

export async function getSignedAvatarUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
