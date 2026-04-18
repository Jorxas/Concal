import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { PlusCircle, UtensilsCrossed } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardGoalsControls } from "@/components/dashboard/dashboard-goals-controls";
import { DailyOverview } from "@/components/dashboard/daily-overview";
import { MacroDisplay } from "@/components/dashboard/macro-display";
import type { GoalRow } from "@/components/dashboard/goal-setting-dialog";

function num(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const dateLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  const { data: goalRow } = await supabase
    .from("user_goals")
    .select(
      "target_calories, target_protein_g, target_carbs_g, target_fat_g, effective_from",
    )
    .eq("user_id", user.id)
    .lte("effective_from", today)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: logRows } = await supabase
    .from("meal_logs")
    .select("calories, protein_g, carbs_g, fat_g")
    .eq("user_id", user.id)
    .eq("logged_on", today);

  const consumed = (logRows ?? []).reduce(
    (acc, row) => ({
      calories: acc.calories + num(row.calories),
      protein: acc.protein + num(row.protein_g),
      carbs: acc.carbs + num(row.carbs_g),
      fat: acc.fat + num(row.fat_g),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const currentGoal: GoalRow | null = goalRow
    ? {
        target_calories: num(goalRow.target_calories),
        target_protein_g: num(goalRow.target_protein_g),
        target_carbs_g: num(goalRow.target_carbs_g),
        target_fat_g: num(goalRow.target_fat_g),
      }
    : null;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UtensilsCrossed className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Tableau de bord
            </h1>
            <p className="text-sm text-muted-foreground">
              Suis tes apports et tes objectifs du jour.
            </p>
          </div>
        </div>
        <Link
          href="/meals/new"
          className={cn(buttonVariants(), "w-full gap-2 sm:w-auto")}
        >
          <PlusCircle className="size-4" aria-hidden />
          Enregistrer un repas
        </Link>
      </header>

      <DashboardGoalsControls currentGoal={currentGoal} />

      {currentGoal ? (
        <div className="space-y-6">
          <DailyOverview
            targetCalories={currentGoal.target_calories}
            consumedCalories={consumed.calories}
            dateLabel={dateLabel}
          />
          <MacroDisplay
            targets={{
              calories: currentGoal.target_calories,
              protein: currentGoal.target_protein_g,
              carbs: currentGoal.target_carbs_g,
              fat: currentGoal.target_fat_g,
            }}
            consumed={consumed}
          />
        </div>
      ) : null}
    </div>
  );
}
