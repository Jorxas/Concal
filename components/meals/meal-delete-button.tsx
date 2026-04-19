"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon, Trash2 } from "lucide-react";
import { deleteMeal } from "@/app/(app)/meals/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type MealDeleteButtonDict = {
  delete: string;
  deleteTitle: string;
  deleteBody: string;
  deleteConfirm: string;
  deleteCancel: string;
  deleting: string;
  deleteSuccess: string;
};

export function MealDeleteButton({
  mealId,
  dict,
}: {
  mealId: string;
  dict: MealDeleteButtonDict;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteMeal(mealId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(dict.deleteSuccess);
      setOpen(false);
      router.push("/profile");
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" aria-hidden />
        {dict.delete}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>{dict.deleteTitle}</DialogTitle>
            <DialogDescription>{dict.deleteBody}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              {dict.deleteCancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              className="gap-1.5"
              onClick={confirmDelete}
            >
              {pending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  {dict.deleting}
                </>
              ) : (
                dict.deleteConfirm
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
