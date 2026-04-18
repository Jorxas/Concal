import { cn } from "@/lib/utils";

type HeroMockupProps = {
  className?: string;
};

/**
 * Decorative SVG mock of the Concal dashboard. Pure SVG so it ships with no
 * image asset and stays crisp on every display.
 */
export function HeroMockup({ className }: HeroMockupProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl",
        "shadow-emerald-900/10",
        className,
      )}
      aria-hidden
    >
      <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/40 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-destructive/40" />
        <span className="size-2.5 rounded-full bg-amber-400/60" />
        <span className="size-2.5 rounded-full bg-primary/60" />
        <span className="ml-3 text-xs text-muted-foreground">
          concal.app / dashboard
        </span>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-[1.1fr_1fr] md:gap-5">
        <div className="rounded-2xl border border-border/60 bg-emerald-soft p-5 text-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium tracking-wide text-primary uppercase">
                Today
              </p>
              <p className="font-heading text-xl">March 14</p>
            </div>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
              On track
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <svg viewBox="0 0 120 120" className="size-28 shrink-0">
              <circle
                cx="60"
                cy="60"
                r="48"
                stroke="oklch(0.92 0.02 160)"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r="48"
                stroke="oklch(0.62 0.15 160)"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="301.59"
                strokeDashoffset="95"
                transform="rotate(-90 60 60)"
              />
              <text
                x="60"
                y="58"
                textAnchor="middle"
                className="fill-foreground"
                style={{ font: "600 20px var(--font-sans)" }}
              >
                1 620
              </text>
              <text
                x="60"
                y="76"
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ font: "500 11px var(--font-sans)" }}
              >
                / 2 100 kcal
              </text>
            </svg>

            <div className="flex-1 space-y-3 text-xs">
              <MacroBar label="Protein" value={72} />
              <MacroBar label="Carbs" value={58} />
              <MacroBar label="Fat" value={41} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3">
            <div className="size-14 shrink-0 rounded-xl bg-emerald-soft" />
            <div className="flex-1">
              <p className="font-medium leading-tight">Green bowl</p>
              <p className="text-xs text-muted-foreground">
                420 kcal · lunch
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              AI
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3">
            <div className="size-14 shrink-0 rounded-xl bg-amber-200/60" />
            <div className="flex-1">
              <p className="font-medium leading-tight">Oats & berries</p>
              <p className="text-xs text-muted-foreground">
                310 kcal · breakfast
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              AI
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3">
            <div className="size-14 shrink-0 rounded-xl bg-rose-200/60" />
            <div className="flex-1">
              <p className="font-medium leading-tight">Tofu stir-fry</p>
              <p className="text-xs text-muted-foreground">
                540 kcal · dinner
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MacroBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value} g</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
