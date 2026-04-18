import { Compass, Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSignedMealImageUrl } from "@/lib/storage/meal-media";
import { firstMealImagePath } from "@/lib/meals/media";
import { MealCard } from "@/components/meals/meal-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";
import { mealCategoryLabel, mealDifficultyLabel } from "@/lib/meals/labels";

type MealMediaRow = { storage_path: string; sort_order: number };

type MealRow = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  calories_per_serving: number | string | null;
  created_at: string;
  meal_media: MealMediaRow[] | null;
};

function num(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export default async function ExploreMealsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { dict } = await getI18n();
  const categoryDict = dict.meals.new.category;
  const difficultyDict = dict.meals.new.difficulty;
  const socialLabels = dict.meals.card;

  const { data: meals } = await supabase
    .from("meals")
    .select(
      "id, title, category, difficulty, calories_per_serving, created_at, meal_media ( storage_path, sort_order )",
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  const list = (meals ?? []) as MealRow[];
  const mealIds = list.map((m) => m.id);

  const [{ data: likesRows }, { data: savesRows }] = await Promise.all([
    mealIds.length
      ? supabase
          .from("recipe_likes")
          .select("meal_id")
          .eq("user_id", user.id)
          .in("meal_id", mealIds)
      : Promise.resolve({ data: [] as { meal_id: string }[] }),
    mealIds.length
      ? supabase
          .from("recipe_saves")
          .select("meal_id")
          .eq("user_id", user.id)
          .in("meal_id", mealIds)
      : Promise.resolve({ data: [] as { meal_id: string }[] }),
  ]);

  const likedSet = new Set((likesRows ?? []).map((r) => r.meal_id));
  const savedSet = new Set((savesRows ?? []).map((r) => r.meal_id));

  const cards = await Promise.all(
    list.map(async (m) => {
      const path = firstMealImagePath(m.meal_media);
      const imageUrl = path
        ? await getSignedMealImageUrl(supabase, path)
        : null;
      return {
        mealId: m.id,
        title: m.title,
        categoryLabel: mealCategoryLabel(m.category, categoryDict),
        difficultyLabel: mealDifficultyLabel(m.difficulty, difficultyDict),
        calories: num(m.calories_per_serving),
        imageUrl,
        initialLiked: likedSet.has(m.id),
        initialSaved: savedSet.has(m.id),
      };
    }),
  );

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-8 md:px-8 md:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            {dict.nav.explore}
          </p>
          <h1 className="mt-1 font-heading text-3xl tracking-tight md:text-4xl">
            {dict.meals.explore.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dict.meals.explore.subtitle}
          </p>
        </div>
        <Link
          href="/meals/new"
          className={cn(
            buttonVariants(),
            "h-11 gap-2 rounded-full px-5 text-sm shadow-sm",
          )}
        >
          <Sparkles className="size-4" aria-hidden />
          {dict.nav.newMeal}
        </Link>
      </header>

      {cards.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 p-12 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Compass className="size-6" aria-hidden />
          </div>
          <p className="mx-auto mt-4 max-w-sm text-sm text-muted-foreground">
            {dict.meals.explore.empty}
          </p>
        </div>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <li key={c.mealId}>
              <MealCard
                {...c}
                kcalUnit={dict.common.kcal}
                perServing={`/ ${dict.common.perServing}`}
                noImageLabel={dict.meals.card.noImage}
                socialLabels={socialLabels}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
