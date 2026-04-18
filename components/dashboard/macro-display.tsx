"use client";

import { Beef, Droplets, Flame, Wheat } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
          <span className="shrink-0 text-muted-foreground" aria-hidden>
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {consumedRounded} / {targetRounded} {unit}
        </span>
      </div>
      <Progress
        value={value}
        aria-label={`${label} : ${value} pour cent de l’objectif journalier`}
      />
    </div>
  );
}

type MacroDisplayProps = {
  targets: MacroTargets;
  consumed: MacroConsumed;
  className?: string;
};

/**
 * Affiche les quatre macros avec barres de progression (Shadcn Progress).
 */
export function MacroDisplay({ targets, consumed, className }: MacroDisplayProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm",
        className,
      )}
      aria-labelledby="macros-heading"
    >
      <h2 id="macros-heading" className="font-heading text-base font-semibold">
        Macronutriments
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Progression par rapport à tes objectifs du jour.
      </p>
      <div className="mt-5 space-y-5">
        <MacroRow
          label="Calories"
          unit="kcal"
          consumed={consumed.calories}
          target={targets.calories}
          icon={<Flame className="size-4" />}
        />
        <MacroRow
          label="Protéines"
          unit="g"
          consumed={consumed.protein}
          target={targets.protein}
          icon={<Beef className="size-4" />}
        />
        <MacroRow
          label="Glucides"
          unit="g"
          consumed={consumed.carbs}
          target={targets.carbs}
          icon={<Wheat className="size-4" />}
        />
        <MacroRow
          label="Lipides"
          unit="g"
          consumed={consumed.fat}
          target={targets.fat}
          icon={<Droplets className="size-4" />}
        />
      </div>
    </section>
  );
}
