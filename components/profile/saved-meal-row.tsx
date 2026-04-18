import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SavedMealRowProps = {
  mealId: string;
  title: string;
  categoryLabel: string;
  calories: number | null;
  imageUrl: string | null;
  metaLabel: string;
  kcalUnit: string;
  noImageLabel: string;
};

export function SavedMealRow({
  mealId,
  title,
  categoryLabel,
  calories,
  imageUrl,
  metaLabel,
  kcalUnit,
  noImageLabel,
}: SavedMealRowProps) {
  const kcal =
    calories !== null && Number.isFinite(Number(calories))
      ? `${Math.round(Number(calories))} ${kcalUnit}`
      : "—";

  return (
    <Link
      href={`/meals/${mealId}`}
      className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-3 shadow-sm transition-colors hover:bg-muted/40"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            unoptimized
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
            {noImageLabel}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="rounded-full bg-primary/10 text-[11px] text-primary"
          >
            {categoryLabel}
          </Badge>
          <span className="text-xs text-muted-foreground tabular-nums">
            {kcal}
          </span>
          <span className="text-xs text-muted-foreground">· {metaLabel}</span>
        </div>
      </div>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
