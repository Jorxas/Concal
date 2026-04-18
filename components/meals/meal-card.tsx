import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { MealSocialBar } from "@/components/meals/meal-social-bar";
import { mealCategoryLabel, mealDifficultyLabel } from "@/lib/meals/labels";

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
      <CardFooter className="p-0">
        <MealSocialBar
          mealId={mealId}
          initialLiked={initialLiked}
          initialSaved={initialSaved}
          className="w-full rounded-b-xl"
        />
      </CardFooter>
    </Card>
  );
}
