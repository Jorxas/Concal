import { ProgressRing } from "@/components/dashboard/progress-ring";

type DailyOverviewProps = {
  targetCalories: number;
  consumedCalories: number;
  dateLabel: string;
  todayLabel: string;
  consumedLabel: string;
  remainingLabel: string;
  overLabel: string;
  kcalLabel: string;
};

export function DailyOverview({
  targetCalories,
  consumedCalories,
  dateLabel,
  todayLabel,
  consumedLabel,
  remainingLabel,
  overLabel,
  kcalLabel,
}: DailyOverviewProps) {
  const ratio = targetCalories > 0 ? consumedCalories / targetCalories : 0;
  const remaining = Math.max(0, targetCalories - consumedCalories);
  const over = consumedCalories > targetCalories;
  const delta = Math.abs(targetCalories - consumedCalories);

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-sm md:p-8"
      aria-labelledby="daily-overview-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            {todayLabel}
          </p>
          <h2
            id="daily-overview-heading"
            className="mt-1 font-heading text-2xl tracking-tight md:text-3xl"
          >
            {dateLabel}
          </h2>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-6 md:flex-row md:gap-10">
        <ProgressRing
          value={ratio}
          variant={over ? "destructive" : "primary"}
          label={
            <span className="tabular-nums">
              {Math.round(consumedCalories)}
            </span>
          }
          sublabel={
            <>
              / {Math.round(targetCalories)} {kcalLabel}
            </>
          }
        />
        <div className="grid flex-1 grid-cols-2 gap-3 md:gap-4">
          <Stat
            label={consumedLabel}
            value={Math.round(consumedCalories)}
            unit={kcalLabel}
          />
          {over ? (
            <Stat
              label={overLabel}
              value={`+${Math.round(delta)}`}
              unit={kcalLabel}
              tone="destructive"
            />
          ) : (
            <Stat
              label={remainingLabel}
              value={Math.round(remaining)}
              unit={kcalLabel}
            />
          )}
        </div>
      </div>
    </section>
  );
}

type StatProps = {
  label: string;
  value: number | string;
  unit: string;
  tone?: "default" | "destructive";
};

function Stat({ label, value, unit, tone = "default" }: StatProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p
        className={
          "mt-1 flex items-baseline gap-1.5 font-heading text-2xl tracking-tight tabular-nums" +
          (tone === "destructive" ? " text-destructive" : "")
        }
      >
        <span>{value}</span>
        <span className="text-sm font-sans font-medium text-muted-foreground">
          {unit}
        </span>
      </p>
    </div>
  );
}
