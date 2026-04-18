"use client";

import { useState } from "react";
import { Settings2, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GoalSettingDialog,
  type GoalDialogDict,
  type GoalRow,
} from "@/components/dashboard/goal-setting-dialog";

export type ControlsDict = {
  welcomeTitle: string;
  welcomeBody: string;
  setGoal: string;
  editGoal: string;
  goal: GoalDialogDict;
};

type Props = {
  currentGoal: GoalRow | null;
  dict: ControlsDict;
};

export function DashboardGoalsControls({ currentGoal, dict }: Props) {
  const [open, setOpen] = useState(false);
  const hasGoal = currentGoal !== null;

  return (
    <>
      {!hasGoal ? (
        <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-8 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-6" aria-hidden />
          </div>
          <h2 className="mt-5 font-heading text-2xl tracking-tight">
            {dict.welcomeTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            {dict.welcomeBody}
          </p>
          <Button
            className="mt-6 h-11 rounded-full px-5 text-sm"
            onClick={() => setOpen(true)}
          >
            <Target className="size-4" aria-hidden />
            {dict.setGoal}
          </Button>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-full px-3"
            onClick={() => setOpen(true)}
          >
            <Settings2 className="size-4" aria-hidden />
            {dict.editGoal}
          </Button>
        </div>
      )}

      <GoalSettingDialog
        open={open}
        onOpenChange={setOpen}
        initialGoal={currentGoal}
        dict={dict.goal}
      />
    </>
  );
}
