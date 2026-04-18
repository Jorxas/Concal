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
  labels: {
    like: string;
    unlike: string;
    save: string;
    unsave: string;
  };
};

export function MealSocialBar({
  mealId,
  initialLiked,
  initialSaved,
  className,
  labels,
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
        "flex items-center justify-end gap-1 border-t border-border/60 bg-card/60 px-3 py-2",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "size-9 rounded-full text-muted-foreground transition-colors hover:text-foreground",
          liked && "text-primary hover:text-primary",
        )}
        disabled={pending}
        aria-pressed={liked}
        aria-label={liked ? labels.unlike : labels.like}
        onClick={() => runToggle(toggleLikeMeal, setLiked)}
      >
        <Heart
          className={cn(
            "size-[18px] transition-colors",
            liked && "fill-primary",
          )}
        />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "size-9 rounded-full text-muted-foreground transition-colors hover:text-foreground",
          saved && "text-primary hover:text-primary",
        )}
        disabled={pending}
        aria-pressed={saved}
        aria-label={saved ? labels.unsave : labels.save}
        onClick={() => runToggle(toggleSaveMeal, setSaved)}
      >
        <Bookmark
          className={cn(
            "size-[18px] transition-colors",
            saved && "fill-primary",
          )}
        />
      </Button>
    </div>
  );
}
