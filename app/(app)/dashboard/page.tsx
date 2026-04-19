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
import {
  DayMealSlots,
  type DaySlotFilled,
  type DaySlotPickRow,
} from "@/components/dashboard/day-meal-slots";
import type { GoalRow } from "@/components/dashboard/goal-setting-dialog";
import { getSignedMealImageUrl } from "@/lib/storage/meal-media";
import { firstMealImagePath } from "@/lib/meals/media";
import { DAY_SLOTS, isDaySlot, type DaySlot } from "@/lib/meals/day-slots";

function num(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numOrNull(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

type MealMedia = { storage_path: string; sort_order: number };

type MealNested = {
  id: string;
  title: string;
  calories_per_serving: number | string | null;
  meal_media: MealMedia[] | null;
};

type SaveRow = {
  meal_id: string;
  meals: MealNested | MealNested[] | null;
};

type OwnedRow = {
  id: string;
  title: string;
  calories_per_serving: number | string | null;
  meal_media: MealMedia[] | null;
};

function asMeal(m: MealNested | MealNested[] | null): MealNested | null {
  if (!m) return null;
  return Array.isArray(m) ? (m[0] ?? null) : m;
}

type SlotLogRow = {
  id: string;
  day_slot: string | null;
  meal_id: string;
  calories: string | number | null;
  protein_g: string | number | null;
  carbs_g: string | number | null;
  fat_g: string | number | null;
  meals: MealNested | MealNested[] | null;
};

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

  const [{ data: goalRow }, { data: slotLogRows }, { data: savesRaw }, { data: ownedRaw }] =
    await Promise.all([
      supabase
        .from("user_goals")
        .select(
          "target_calories, target_protein_g, target_carbs_g, target_fat_g, effective_from",
        )
        .eq("user_id", user.id)
        .lte("effective_from", today)
        .order("effective_from", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("meal_logs")
        .select(
          `id, day_slot, meal_id, calories, protein_g, carbs_g, fat_g,
           meals ( id, title )`,
        )
        .eq("user_id", user.id)
        .eq("logged_on", today)
        .in("day_slot", [...DAY_SLOTS]),
      supabase
        .from("recipe_saves")
        .select(
          `meal_id, meals ( id, title, calories_per_serving, meal_media ( storage_path, sort_order ) )`,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(60),
      supabase
        .from("meals")
        .select(
          "id, title, calories_per_serving, meal_media ( storage_path, sort_order )",
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(60),
    ]);

  const consumed = (slotLogRows ?? []).reduce(
    (acc, row) => ({
      calories: acc.calories + num(row.calories),
      protein: acc.protein + num(row.protein_g),
      carbs: acc.carbs + num(row.carbs_g),
      fat: acc.fat + num(row.fat_g),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const filledBySlot: Partial<Record<DaySlot, DaySlotFilled>> = {};
  for (const raw of slotLogRows ?? []) {
    const row = raw as SlotLogRow;
    if (!row.day_slot || !isDaySlot(row.day_slot)) continue;
    const m = asMeal(row.meals as MealNested | MealNested[] | null);
    filledBySlot[row.day_slot] = {
      logId: row.id,
      mealId: row.meal_id,
      title: m?.title ?? "—",
      calories: numOrNull(row.calories),
      protein: num(row.protein_g),
      carbs: num(row.carbs_g),
      fat: num(row.fat_g),
    };
  }

  const saves = (savesRaw ?? []) as SaveRow[];
  const owned = (ownedRaw ?? []) as OwnedRow[];

  const minePickRows: DaySlotPickRow[] = await Promise.all(
    owned.map(async (row) => {
      const path = firstMealImagePath(row.meal_media);
      const imageUrl = path ? await getSignedMealImageUrl(supabase, path) : null;
      return {
        mealId: row.id,
        title: row.title,
        calories: numOrNull(row.calories_per_serving),
        imageUrl,
      };
    }),
  );

  const savedPickRows: DaySlotPickRow[] = (
    await Promise.all(
      saves.map(async (row) => {
        const meal = asMeal(row.meals);
        if (!meal) return null;
        const path = firstMealImagePath(meal.meal_media);
        const imageUrl = path ? await getSignedMealImageUrl(supabase, path) : null;
        return {
          mealId: meal.id,
          title: meal.title,
          calories: numOrNull(meal.calories_per_serving),
          imageUrl,
        };
      }),
    )
  ).filter(Boolean) as DaySlotPickRow[];

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

  const daySlotsDict = dict.dashboard.daySlots;

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
          {dict.dashboard.newRecipe}
        </Link>
      </header>

      <DashboardGoalsControls currentGoal={currentGoal} dict={controlsDict} />

      <DayMealSlots
        filledBySlot={filledBySlot}
        mine={minePickRows}
        saved={savedPickRows}
        dict={daySlotsDict}
      />

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
