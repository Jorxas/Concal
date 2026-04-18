"use client";

import { Beef, Droplets, Flame, Wheat } from "lucide-react";
import { cn } from "@/lib/utils";

export type MacroTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MacroConsumed = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MacroDict = {
  title: string;
  subtitle: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  kcal: string;
  grams: string;
};

function pct(consumed: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((consumed / target) * 100));
}

type MacroRowProps = {
  label: string;
  unit: string;
  consumed: number;
  target: number;
  icon: React.ReactNode;
};

function MacroRow({
  label,
  unit,
  consumed,
  target,
  icon,
}: MacroRowProps) {
  const value = pct(consumed, target);
  const consumedRounded =
    unit === "kcal" ? Math.round(consumed) : Math.round(consumed * 10) / 10;
  const targetRounded =
    unit === "kcal" ? Math.round(target) : Math.round(target * 10) / 10;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex min-w-0 items-center gap-2 font-medium">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
            aria-hidden
          >
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {consumedRounded} / {targetRounded} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${value}%` }}
          aria-label={`${label}: ${value}%`}
        />
      </div>
    </div>
  );
}

type MacroDisplayProps = {
  targets: MacroTargets;
  consumed: MacroConsumed;
  dict: MacroDict;
  className?: string;
};

export function MacroDisplay({
  targets,
  consumed,
  dict,
  className,
}: MacroDisplayProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border/60 bg-card p-6 shadow-sm md:p-7",
        className,
      )}
      aria-labelledby="macros-heading"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2
            id="macros-heading"
            className="font-heading text-xl tracking-tight"
          >
            {dict.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{dict.subtitle}</p>
        </div>
      </div>
      <div className="mt-6 space-y-5">
        <MacroRow
          label={dict.calories}
          unit={dict.kcal}
          consumed={consumed.calories}
          target={targets.calories}
          icon={<Flame className="size-3.5" />}
        />
        <MacroRow
          label={dict.protein}
          unit={dict.grams}
          consumed={consumed.protein}
          target={targets.protein}
          icon={<Beef className="size-3.5" />}
        />
        <MacroRow
          label={dict.carbs}
          unit={dict.grams}
          consumed={consumed.carbs}
          target={targets.carbs}
          icon={<Wheat className="size-3.5" />}
        />
        <MacroRow
          label={dict.fat}
          unit={dict.grams}
          consumed={consumed.fat}
          target={targets.fat}
          icon={<Droplets className="size-3.5" />}
        />
      </div>
    </section>
  );
}
