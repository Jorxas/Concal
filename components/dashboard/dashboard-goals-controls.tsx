"use client";

import { useState } from "react";
import { LayoutDashboard, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GoalSettingDialog,
  type GoalRow,
} from "@/components/dashboard/goal-setting-dialog";

type DashboardGoalsControlsProps = {
  /** `null` si aucun objectif en base pour la période courante. */
  currentGoal: GoalRow | null;
};

/**
 * Bandeau d’accueil ou bouton d’édition + dialogue d’objectifs.
 */
export function DashboardGoalsControls({
  currentGoal,
}: DashboardGoalsControlsProps) {
  const [open, setOpen] = useState(false);
  const hasGoal = currentGoal !== null;

  return (
    <>
      {!hasGoal ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-6" aria-hidden />
          </div>
          <h2 className="mt-4 font-heading text-lg font-semibold">
            Bienvenue !
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Définis ton objectif calorique quotidien pour commencer le suivi.
            Les macronutriments (protéines, glucides, lipides) permettent de
            remplir les barres de progression.
          </p>
          <Button className="mt-5" onClick={() => setOpen(true)}>
            <Target className="size-4" aria-hidden />
            Définir mes objectifs
          </Button>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <LayoutDashboard className="size-4" aria-hidden />
            Modifier les objectifs
          </Button>
        </div>
      )}

      <GoalSettingDialog
        open={open}
        onOpenChange={setOpen}
        initialGoal={currentGoal}
      />
    </>
  );
}
