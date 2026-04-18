"use client";

import { useEffect, useId, useState } from "react";
import { upsertUserGoals } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type GoalRow = {
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
};

export type GoalDialogDict = {
  title: string;
  subtitle: string;
  caloriesLabel: string;
  proteinLabel: string;
  carbsLabel: string;
  fatLabel: string;
  save: string;
  saving: string;
  cancel: string;
};

const FALLBACK_DEFAULTS: GoalRow = {
  target_calories: 2000,
  target_protein_g: 130,
  target_carbs_g: 250,
  target_fat_g: 70,
};

type GoalSettingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialGoal: GoalRow | null;
  dict: GoalDialogDict;
};

export function GoalSettingDialog({
  open,
  onOpenChange,
  initialGoal,
  dict,
}: GoalSettingDialogProps) {
  const formId = useId();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const defaults = initialGoal ?? FALLBACK_DEFAULTS;
  const formKey = `${open}-${defaults.target_calories}-${defaults.target_protein_g}-${defaults.target_carbs_g}-${defaults.target_fat_g}`;

  useEffect(() => {
    if (!open) setError(null);
  }, [open]);

  async function submitGoals(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const result = await upsertUserGoals(undefined, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {dict.title}
          </DialogTitle>
          <DialogDescription>{dict.subtitle}</DialogDescription>
        </DialogHeader>

        <form key={formKey} id={formId} action={submitGoals} className="space-y-4">
          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={`${formId}-cal`}>{dict.caloriesLabel}</Label>
            <Input
              id={`${formId}-cal`}
              name="target_calories"
              type="number"
              min={1}
              max={20000}
              step={1}
              required
              defaultValue={defaults.target_calories}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-p`}>{dict.proteinLabel}</Label>
            <Input
              id={`${formId}-p`}
              name="target_protein_g"
              type="number"
              min={0}
              max={1000}
              step={0.1}
              required
              defaultValue={defaults.target_protein_g}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-c`}>{dict.carbsLabel}</Label>
            <Input
              id={`${formId}-c`}
              name="target_carbs_g"
              type="number"
              min={0}
              max={1000}
              step={0.1}
              required
              defaultValue={defaults.target_carbs_g}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-f`}>{dict.fatLabel}</Label>
            <Input
              id={`${formId}-f`}
              name="target_fat_g"
              type="number"
              min={0}
              max={1000}
              step={0.1}
              required
              defaultValue={defaults.target_fat_g}
              disabled={pending}
            />
          </div>
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {dict.cancel}
          </Button>
          <Button type="submit" form={formId} disabled={pending}>
            {pending ? dict.saving : dict.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
