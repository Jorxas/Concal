"use client";

import { useActionState } from "react";
import { Loader2Icon, Upload } from "lucide-react";
import { updateProfileAvatar } from "@/app/(app)/profile/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type ProfileAvatarFormDict = {
  avatarChange: string;
  avatarPick: string;
  avatarUploading: string;
  avatarSuccess: string;
};

export function ProfileAvatarForm({ dict }: { dict: ProfileAvatarFormDict }) {
  const [state, formAction, pending] = useActionState(updateProfileAvatar, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="profile-avatar" className="text-xs text-muted-foreground">
            {dict.avatarChange}
          </Label>
          <input
            id="profile-avatar"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={pending}
            className="block w-full max-w-xs text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/15"
          />
        </div>
        <Button
          type="submit"
          disabled={pending}
          variant="secondary"
          className="h-10 shrink-0 gap-2 rounded-full"
        >
          {pending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              {dict.avatarUploading}
            </>
          ) : (
            <>
              <Upload className="size-4" aria-hidden />
              {dict.avatarPick}
            </>
          )}
        </Button>
      </div>
      {state?.ok ? (
        <p className="text-sm text-primary" role="status">
          {dict.avatarSuccess}
        </p>
      ) : null}
      {state && !state.ok ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
