import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { mealCategoryLabel } from "@/lib/meals/labels";

type SavedMealRowProps = {
  mealId: string;
  title: string;
  category: string;
  calories: number | null;
  imageUrl: string | null;
  savedAtLabel: string;
};

export function SavedMealRow({
  mealId,
  title,
  category,
  calories,
  imageUrl,
  savedAtLabel,
}: SavedMealRowProps) {
  const kcal =
    calories !== null && Number.isFinite(Number(calories))
      ? `${Math.round(Number(calories))} kcal`
      : "—";

  return (
    <Link
      href={`/meals/${mealId}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-muted/40"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            —
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {mealCategoryLabel(category)}
          </Badge>
          <span className="text-xs text-muted-foreground">{kcal}</span>
          <span className="text-xs text-muted-foreground">· {savedAtLabel}</span>
        </div>
      </div>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}
