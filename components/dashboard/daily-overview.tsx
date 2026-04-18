import { Flame, Gauge } from "lucide-react";

type DailyOverviewProps = {
  /** Calories objectif pour la journée */
  targetCalories: number;
  /** Calories consommées aujourd’hui */
  consumedCalories: number;
  /** Libellé de la date affichée (ex. « 18 avril 2026 ») */
  dateLabel: string;
};

/**
 * Résumé textuel de la journée : calories restantes et contexte.
 */
export function DailyOverview({
  targetCalories,
  consumedCalories,
  dateLabel,
}: DailyOverviewProps) {
  const remaining = Math.max(0, targetCalories - consumedCalories);
  const over = consumedCalories > targetCalories;
  const delta = Math.abs(targetCalories - consumedCalories);

  return (
    <section
      className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm"
      aria-labelledby="daily-overview-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Aujourd’hui
          </p>
          <h2
            id="daily-overview-heading"
            className="mt-1 font-heading text-lg font-semibold"
          >
            Vue d’ensemble — {dateLabel}
          </h2>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Flame className="size-5" aria-hidden />
        </div>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Calories consommées</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {Math.round(consumedCalories)}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              / {targetCalories} kcal
            </span>
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Calories restantes</p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-semibold tabular-nums">
            {over ? (
              <>
                <span className="text-destructive">+{Math.round(delta)}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  au-dessus de l’objectif
                </span>
              </>
            ) : (
              <>
                <Gauge className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <span>{Math.round(remaining)}</span>
                <span className="text-sm font-normal text-muted-foreground">kcal</span>
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
