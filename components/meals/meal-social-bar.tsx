"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  toggleLikeMeal,
  toggleSaveMeal,
  type ToggleSocialResult,
} from "@/app/(app)/meals/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bookmark, Heart } from "lucide-react";

export type MealSocialBarProps = {
  mealId: string;
  initialLiked: boolean;
  initialSaved: boolean;
  className?: string;
};

export function MealSocialBar({
  mealId,
  initialLiked,
  initialSaved,
  className,
}: MealSocialBarProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function runToggle(
    action: (id: string) => Promise<ToggleSocialResult>,
    setState: (v: boolean) => void,
  ) {
    startTransition(async () => {
      const result = await action(mealId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setState(result.active);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "flex justify-end gap-1 border-t bg-muted/30 px-3 pt-3 pb-3",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground"
        disabled={pending}
        aria-pressed={liked}
        aria-label={liked ? "Retirer le j’aime" : "J’aime"}
        onClick={() => runToggle(toggleLikeMeal, setLiked)}
      >
        <Heart
          className={cn(
            "size-5 transition-colors",
            liked && "fill-primary text-primary",
          )}
        />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground"
        disabled={pending}
        aria-pressed={saved}
        aria-label={saved ? "Retirer des favoris" : "Enregistrer"}
        onClick={() => runToggle(toggleSaveMeal, setSaved)}
      >
        <Bookmark
          className={cn(
            "size-5 transition-colors",
            saved && "fill-primary text-primary",
          )}
        />
      </Button>
    </div>
  );
}
