"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AVATARS_BUCKET, uploadUserAvatar } from "@/lib/storage/avatar";

export type UpdateAvatarState =
  | { ok: true }
  | { ok: false; error: string };

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
