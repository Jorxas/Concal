import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MealSocialBar } from "@/components/meals/meal-social-bar";

export type MealCardProps = {
  mealId: string;
  title: string;
  categoryLabel: string;
  difficultyLabel: string;
  calories: number | null;
  imageUrl: string | null;
  initialLiked: boolean;
  initialSaved: boolean;
  kcalUnit: string;
  perServing: string;
  noImageLabel: string;
  socialLabels: {
    like: string;
    unlike: string;
    save: string;
    unsave: string;
  };
};

export function MealCard({
  mealId,
  title,
  categoryLabel,
  difficultyLabel,
  calories,
  imageUrl,
  initialLiked,
  initialSaved,
  kcalUnit,
  perServing,
  noImageLabel,
  socialLabels,
}: MealCardProps) {
  const kcal =
    calories !== null && Number.isFinite(Number(calories))
      ? Math.round(Number(calories))
      : null;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={`/meals/${mealId}`}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-[5/4] w-full overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              {noImageLabel}
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/20 to-transparent" />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="secondary"
            className="rounded-full bg-primary/10 text-primary"
          >
            {categoryLabel}
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full border-border/70"
          >
            {difficultyLabel}
          </Badge>
        </div>
        <Link
          href={`/meals/${mealId}`}
          className="font-heading text-lg leading-snug tracking-tight hover:underline underline-offset-2"
        >
          {title}
        </Link>
        <p className="mt-auto text-sm text-muted-foreground">
          {kcal === null
            ? `— ${kcalUnit}`
            : `${kcal} ${kcalUnit} ${perServing}`}
        </p>
      </div>
      <MealSocialBar
        mealId={mealId}
        initialLiked={initialLiked}
        initialSaved={initialSaved}
        labels={socialLabels}
      />
    </article>
  );
}
