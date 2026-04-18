import { Bookmark, Camera, Heart, Sparkles } from "lucide-react";

export function AIFeatureVisual() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl">
      <div className="relative aspect-[4/3] bg-emerald-soft">
        <div className="absolute inset-6 rounded-2xl border border-dashed border-primary/40 bg-background/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-background/80 p-3 shadow-lg backdrop-blur">
            <Camera className="size-7 text-primary" aria-hidden />
          </div>
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
            <Sparkles className="size-3" aria-hidden />
            AI draft
          </span>
          <span className="text-[11px] text-muted-foreground">0.8 s</span>
        </div>
        <p className="font-heading text-lg">Green quinoa bowl</p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <MicroStat label="kcal" value="520" />
          <MicroStat label="prot" value="28 g" />
          <MicroStat label="fat" value="18 g" />
        </div>
      </div>
    </div>
  );
}

export function DashboardFeatureVisual() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium tracking-wide text-primary uppercase">
            Today
          </p>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            77%
          </span>
        </div>
        <div className="mt-4 flex items-center gap-5">
          <svg viewBox="0 0 120 120" className="size-24">
            <circle
              cx="60"
              cy="60"
              r="48"
              stroke="oklch(0.92 0.02 160)"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r="48"
              stroke="oklch(0.62 0.15 160)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="301.59"
              strokeDashoffset="70"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="flex-1 space-y-2 text-xs">
            <Bar label="Protein" value={80} />
            <Bar label="Carbs" value={64} />
            <Bar label="Fat" value={42} />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-[10px] font-medium uppercase text-muted-foreground">
              Streak
            </p>
            <p className="font-heading text-lg">12 days</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-[10px] font-medium uppercase text-muted-foreground">
              Meals
            </p>
            <p className="font-heading text-lg">3 / 4</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SocialFeatureVisual() {
  return (
    <div className="space-y-3">
      {[
        { title: "Salmon teriyaki", author: "Léa", kcal: 610 },
        { title: "Tahini noodles", author: "Mo", kcal: 540 },
        { title: "Berry overnight oats", author: "Ana", kcal: 380 },
      ].map((item) => (
        <div
          key={item.title}
          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
        >
          <div className="size-14 shrink-0 rounded-xl bg-emerald-soft" />
          <div className="flex-1">
            <p className="font-medium leading-tight">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              @{item.author} · {item.kcal} kcal
            </p>
          </div>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground"
            aria-hidden
            tabIndex={-1}
          >
            <Heart className="size-4" />
          </button>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full text-primary"
            aria-hidden
            tabIndex={-1}
          >
            <Bookmark className="size-4 fill-primary" />
          </button>
        </div>
      ))}
    </div>
  );
}

function MicroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-2.5 py-2">
      <p className="text-[10px] font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="font-heading text-sm">{value}</p>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
