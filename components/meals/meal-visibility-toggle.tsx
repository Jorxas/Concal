"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, Loader2Icon, Lock } from "lucide-react";
import { toggleMealVisibility } from "@/app/(app)/meals/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MealVisibilityToggleDict = {
  makePublic: string;
  makePrivate: string;
  ariaMakePublic: string;
  ariaMakePrivate: string;
  toastNowPublic: string;
  toastNowPrivate: string;
  pending: string;
};

export function MealVisibilityToggle({
  mealId,
  initialIsPublic,
  dict,
}: {
  mealId: string;
  initialIsPublic: boolean;
  dict: MealVisibilityToggleDict;
}) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await toggleMealVisibility(mealId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setIsPublic(result.isPublic);
      toast.success(
        result.isPublic ? dict.toastNowPublic : dict.toastNowPrivate,
      );
      router.refresh();
    });
  }

  const nextPublic = !isPublic;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={onClick}
      className={cn("gap-1.5 rounded-full")}
      aria-label={nextPublic ? dict.ariaMakePublic : dict.ariaMakePrivate}
    >
      {pending ? (
        <>
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
          {dict.pending}
        </>
      ) : nextPublic ? (
        <>
          <Globe className="size-4" aria-hidden />
          {dict.makePublic}
        </>
      ) : (
        <>
          <Lock className="size-4" aria-hidden />
          {dict.makePrivate}
        </>
      )}
    </Button>
  );
}
