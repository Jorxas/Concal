import { format } from "date-fns";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";
import { dateLocaleFor } from "@/lib/i18n/date";
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

  if (!user) return null;

  const { dict, locale } = await getI18n();
  const dateLocale = dateLocaleFor(locale);

  const today = format(new Date(), "yyyy-MM-dd");
  const dateLabel = format(new Date(), "EEEE d MMMM yyyy", {
    locale: dateLocale,
  });

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

  const controlsDict = {
    welcomeTitle: dict.dashboard.welcomeTitle,
    welcomeBody: dict.dashboard.welcomeBody,
    setGoal: dict.dashboard.setGoal,
    editGoal: dict.dashboard.editGoal,
    goal: {
      ...dict.dashboard.goal,
      save: dict.common.save,
      cancel: dict.common.cancel,
    },
  };

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-8 md:px-8 md:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            {dict.dashboard.todayLabel}
          </p>
          <h1 className="mt-1 font-heading text-3xl tracking-tight md:text-4xl">
            {dict.dashboard.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dict.dashboard.subtitle}
          </p>
        </div>
        <Link
          href="/meals/new"
          className={cn(
            buttonVariants(),
            "h-11 gap-2 self-start rounded-full px-5 text-sm shadow-sm sm:self-auto",
          )}
        >
          <PlusCircle className="size-4" aria-hidden />
          {dict.dashboard.logMeal}
        </Link>
      </header>

      <DashboardGoalsControls currentGoal={currentGoal} dict={controlsDict} />

      {currentGoal ? (
        <div className="space-y-6">
          <DailyOverview
            targetCalories={currentGoal.target_calories}
            consumedCalories={consumed.calories}
            dateLabel={dateLabel}
            todayLabel={dict.dashboard.todayLabel}
            consumedLabel={dict.dashboard.consumed}
            remainingLabel={dict.dashboard.remaining}
            overLabel={dict.dashboard.over}
            kcalLabel={dict.common.kcal}
          />
          <MacroDisplay
            targets={{
              calories: currentGoal.target_calories,
              protein: currentGoal.target_protein_g,
              carbs: currentGoal.target_carbs_g,
              fat: currentGoal.target_fat_g,
            }}
            consumed={consumed}
            dict={{
              title: dict.dashboard.macros,
              subtitle: dict.dashboard.macrosSubtitle,
              calories: dict.dashboard.calories,
              protein: dict.dashboard.protein,
              carbs: dict.dashboard.carbs,
              fat: dict.dashboard.fat,
              kcal: dict.common.kcal,
              grams: dict.common.grams,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
