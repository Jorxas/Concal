"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  toggleLikeMeal,
  toggleSaveMeal,
  type ToggleSocialResult,
} from "@/app/(app)/meals/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { mealCategoryLabel, mealDifficultyLabel } from "@/lib/meals/labels";
import { cn } from "@/lib/utils";
import { Bookmark, Heart } from "lucide-react";

export type MealCardProps = {
  mealId: string;
  title: string;
  category: string;
  difficulty: string;
  calories: number | null;
  imageUrl: string | null;
  initialLiked: boolean;
  initialSaved: boolean;
};

/**
 * Carte repas pour le fil d’exploration : visuel, badges, macros, like / favori.
 */
export function MealCard({
  mealId,
  title,
  category,
  difficulty,
  calories,
  imageUrl,
  initialLiked,
  initialSaved,
}: MealCardProps) {
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

  const kcal =
    calories !== null && Number.isFinite(Number(calories))
      ? Math.round(Number(calories))
      : "—";

  return (
    <Card className="overflow-hidden pt-0">
      <Link href={`/meals/${mealId}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              Pas d’image
            </div>
          )}
        </div>
      </Link>
      <CardHeader className="gap-2 pb-2">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{mealCategoryLabel(category)}</Badge>
          <Badge variant="outline">{mealDifficultyLabel(difficulty)}</Badge>
        </div>
        <Link
          href={`/meals/${mealId}`}
          className="font-heading text-base font-semibold leading-snug hover:underline"
        >
          {title}
        </Link>
        <p className="text-sm text-muted-foreground">
          {kcal === "—" ? "— kcal" : `${kcal} kcal / portion`}
        </p>
      </CardHeader>
      <CardFooter className="flex justify-end gap-1 border-t bg-muted/30 pt-3 pb-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          disabled={pending}
          aria-pressed={liked}
          aria-label={liked ? "Retirer le j’aime" : "J’aime"}
          onClick={(e) => {
            e.preventDefault();
            runToggle(toggleLikeMeal, setLiked);
          }}
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
          onClick={(e) => {
            e.preventDefault();
            runToggle(toggleSaveMeal, setSaved);
          }}
        >
          <Bookmark
            className={cn(
              "size-5 transition-colors",
              saved && "fill-primary text-primary",
            )}
          />
        </Button>
      </CardFooter>
    </Card>
  );
}
