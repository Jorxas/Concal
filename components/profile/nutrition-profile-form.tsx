"use client";

import { useActionState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon, Scale } from "lucide-react";
import {
  saveNutritionProfile,
  type SaveNutritionProfileState,
} from "@/app/(app)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type NutritionProfileRow = {
  sex: "male" | "female" | "other";
  age_years: number;
  height_cm: number;
  weight_kg: number;
  activity_sessions_per_week: number;
  goal_type: "lose_weight" | "maintain" | "gain_mass";
};

export type NutritionProfileDict = {
  title: string;
  subtitle: string;
  disclaimer: string;
  sexLabel: string;
  sexMale: string;
  sexFemale: string;
  sexOther: string;
  ageLabel: string;
  heightLabel: string;
  weightLabel: string;
  activityLabel: string;
  activityHelp: string;
  goalLabel: string;
  goalLose: string;
  goalMaintain: string;
  goalGain: string;
  submit: string;
  saving: string;
  successToast: string;
  afterSaveHint: string;
};

const DEFAULTS: NutritionProfileRow = {
  sex: "other",
  age_years: 30,
  height_cm: 170,
  weight_kg: 70,
  activity_sessions_per_week: 3,
  goal_type: "maintain",
};

function num(v: string | number | null | undefined, fallback: number): number {
  if (v === null || v === undefined) return fallback;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function NutritionProfileForm({
  initial,
  dict,
}: {
  initial: NutritionProfileRow | null;
  dict: NutritionProfileDict;
}) {
  const router = useRouter();
  const formId = useId();
  const base = initial ?? DEFAULTS;

  const [state, formAction, pending] = useActionState<
    SaveNutritionProfileState | undefined,
    FormData
  >(saveNutritionProfile, undefined);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(dict.successToast, { id: "nutrition-profile-ok" });
      router.refresh();
      return;
    }
    toast.error(state.error, { id: "nutrition-profile-err" });
  }, [state, dict.successToast, router]);

  const w = num(initial?.weight_kg, DEFAULTS.weight_kg);

  return (
    <section
      id="nutrition"
      aria-labelledby={`${formId}-nutrition-title`}
      className="scroll-mt-24 space-y-5 rounded-3xl border border-border/60 bg-card p-6 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Scale className="size-5" aria-hidden />
        </span>
        <div>
          <h2
            id={`${formId}-nutrition-title`}
            className="font-heading text-xl tracking-tight"
          >
            {dict.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{dict.subtitle}</p>
          <p className="mt-2 text-xs text-muted-foreground">{dict.disclaimer}</p>
        </div>
      </div>

      <form
        key={`${base.sex}-${base.age_years}-${base.height_cm}-${w}-${base.activity_sessions_per_week}-${base.goal_type}`}
        action={formAction}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${formId}-sex`}>{dict.sexLabel}</Label>
            <select
              id={`${formId}-sex`}
              name="sex"
              required
              disabled={pending}
              defaultValue={base.sex}
              className={cn(
                "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <option value="male">{dict.sexMale}</option>
              <option value="female">{dict.sexFemale}</option>
              <option value="other">{dict.sexOther}</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-goal`}>{dict.goalLabel}</Label>
            <select
              id={`${formId}-goal`}
              name="goal_type"
              required
              disabled={pending}
              defaultValue={base.goal_type}
              className={cn(
                "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <option value="lose_weight">{dict.goalLose}</option>
              <option value="maintain">{dict.goalMaintain}</option>
              <option value="gain_mass">{dict.goalGain}</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`${formId}-age`}>{dict.ageLabel}</Label>
            <Input
              id={`${formId}-age`}
              name="age_years"
              type="number"
              min={14}
              max={100}
              step={1}
              required
              defaultValue={base.age_years}
              disabled={pending}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-h`}>{dict.heightLabel}</Label>
            <Input
              id={`${formId}-h`}
              name="height_cm"
              type="number"
              min={100}
              max={250}
              step={1}
              required
              defaultValue={base.height_cm}
              disabled={pending}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-w`}>{dict.weightLabel}</Label>
            <Input
              id={`${formId}-w`}
              name="weight_kg"
              type="number"
              min={30}
              max={400}
              step={0.1}
              required
              defaultValue={w}
              disabled={pending}
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-act`}>{dict.activityLabel}</Label>
          <Input
            id={`${formId}-act`}
            name="activity_sessions_per_week"
            type="number"
            min={0}
            max={21}
            step={1}
            required
            defaultValue={base.activity_sessions_per_week}
            disabled={pending}
            className="h-11 max-w-xs"
          />
          <p className="text-xs text-muted-foreground">{dict.activityHelp}</p>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground sm:max-w-md">
            {dict.afterSaveHint}
          </p>
          <Button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-6"
          >
            {pending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                {dict.saving}
              </>
            ) : (
              dict.submit
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
