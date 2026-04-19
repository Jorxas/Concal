"use client";

import Image from "next/image";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { Camera, Eye, Loader2Icon, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  removeProfileAvatar,
  updateProfileAvatar,
} from "@/app/(app)/profile/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ProfileAvatarPickerDict = {
  avatarAlt: string;
  avatarMenuAria: string;
  avatarSheetTitle: string;
  avatarView: string;
  avatarPickAction: string;
  avatarRemove: string;
  avatarCancel: string;
  avatarRemoveTitle: string;
  avatarRemoveBody: string;
  avatarRemoveConfirm: string;
  avatarSuccess: string;
  avatarRemoved: string;
};

type Panel = "menu" | "view" | "removeConfirm";

export function ProfileAvatarPicker({
  avatarSignedUrl,
  initials,
  dict,
}: {
  avatarSignedUrl: string | null;
  initials: string;
  dict: ProfileAvatarPickerDict;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("menu");
  const [removePending, startRemove] = useTransition();

  const [uploadState, uploadAction, uploadPending] = useActionState(
    updateProfileAvatar,
    undefined,
  );
  const uploadToastDone = useRef(false);

  useEffect(() => {
    if (!uploadState) return;
    if (uploadState.ok) {
      if (uploadToastDone.current) return;
      uploadToastDone.current = true;
      toast.success(dict.avatarSuccess);
      setOpen(false);
      setPanel("menu");
      router.refresh();
      return;
    }
    uploadToastDone.current = false;
    toast.error(uploadState.error);
  }, [uploadState, dict.avatarSuccess, router]);

  function openMenu() {
    setPanel("menu");
    setOpen(true);
  }

  function closeAll() {
    setOpen(false);
    setPanel("menu");
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    uploadToastDone.current = false;
    const fd = new FormData();
    fd.set("avatar", file);
    uploadAction(fd);
  }

  function confirmRemove() {
    startRemove(async () => {
      const r = await removeProfileAvatar();
      if (r.ok) {
        toast.success(dict.avatarRemoved);
        closeAll();
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  const busy = uploadPending || removePending;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        name="avatar"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={onFileChange}
        aria-hidden
      />

      <button
        type="button"
        onClick={openMenu}
        disabled={busy}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={dict.avatarMenuAria}
        className={cn(
          "group relative shrink-0 rounded-2xl outline-none ring-offset-2 ring-offset-background transition focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50",
          "after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:ring-border/60 after:transition group-hover:after:ring-primary/40",
        )}
      >
        {avatarSignedUrl ? (
          <Image
            src={avatarSignedUrl}
            alt={dict.avatarAlt}
            width={56}
            height={56}
            unoptimized
            className="size-14 rounded-2xl object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 font-heading text-xl font-semibold text-primary"
          >
            {initials}
          </span>
        )}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 transition group-hover:bg-black/25 group-focus-visible:bg-black/20">
          <Camera
            className="size-6 text-white opacity-0 drop-shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-90"
            aria-hidden
          />
        </span>
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeAll();
          else setOpen(true);
        }}
      >
        <DialogContent
          showCloseButton={panel === "view"}
          className={cn(
            "fixed flex max-h-[min(85dvh,420px)] w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-sm",
            "bottom-0 top-auto translate-y-0 rounded-b-none rounded-t-3xl border-x-0 border-b-0 sm:bottom-auto sm:top-1/2 sm:max-h-none sm:translate-y-[-50%] sm:rounded-2xl sm:border",
          )}
        >
          {panel === "menu" ? (
            <>
              <DialogHeader className="border-b border-border/60 px-5 py-4 text-left">
                <DialogTitle className="font-heading text-lg">
                  {dict.avatarSheetTitle}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {dict.avatarMenuAria}
                </DialogDescription>
              </DialogHeader>
              <div className="relative flex flex-col pb-[env(safe-area-inset-bottom)]">
                {uploadPending ? (
                  <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm"
                    aria-busy="true"
                  >
                    <Loader2Icon className="size-8 animate-spin text-primary" aria-hidden />
                  </div>
                ) : null}
                {avatarSignedUrl ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setPanel("view")}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium transition hover:bg-muted/80 active:bg-muted"
                  >
                    <Eye className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                    {dict.avatarView}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium transition hover:bg-muted/80 active:bg-muted"
                >
                  <Camera className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  {dict.avatarPickAction}
                </button>
                {avatarSignedUrl ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setPanel("removeConfirm")}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-destructive transition hover:bg-destructive/10 active:bg-destructive/15"
                  >
                    <Trash2 className="size-5 shrink-0" aria-hidden />
                    {dict.avatarRemove}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={closeAll}
                  className="mt-1 border-t border-border/60 px-5 py-4 text-center text-sm font-medium text-muted-foreground transition hover:bg-muted/50"
                >
                  {dict.avatarCancel}
                </button>
              </div>
            </>
          ) : null}

          {panel === "view" && avatarSignedUrl ? (
            <div className="flex flex-col">
              <DialogHeader className="border-b border-border/60 px-4 py-3">
                <DialogTitle className="text-center font-heading text-base">
                  {dict.avatarView}
                </DialogTitle>
              </DialogHeader>
              <div className="relative flex max-h-[70dvh] items-center justify-center bg-muted/30 p-4">
                <Image
                  src={avatarSignedUrl}
                  alt={dict.avatarAlt}
                  width={512}
                  height={512}
                  unoptimized
                  className="max-h-[65dvh] w-auto max-w-full object-contain"
                />
              </div>
              <div className="border-t border-border/60 p-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full rounded-full"
                  onClick={() => setPanel("menu")}
                >
                  {dict.avatarCancel}
                </Button>
              </div>
            </div>
          ) : null}

          {panel === "removeConfirm" ? (
            <div className="flex flex-col gap-4 p-6">
              <DialogHeader className="space-y-2 p-0 text-left">
                <DialogTitle className="font-heading text-lg">
                  {dict.avatarRemoveTitle}
                </DialogTitle>
                <DialogDescription>{dict.avatarRemoveBody}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={removePending}
                  onClick={() => setPanel("menu")}
                >
                  {dict.avatarCancel}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-full"
                  disabled={removePending}
                  onClick={confirmRemove}
                >
                  {dict.avatarRemoveConfirm}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
