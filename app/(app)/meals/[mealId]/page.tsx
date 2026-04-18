import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSignedMealImageUrl } from "@/lib/storage/meal-media";
import { firstMealImagePath } from "@/lib/meals/media";
import { mealCategoryLabel, mealDifficultyLabel } from "@/lib/meals/labels";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MealSocialBar } from "@/components/meals/meal-social-bar";
import { cn } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";

const ingredientEntrySchema = z.object({
  name: z.string(),
  amount: z.string().optional(),
  unit: z.string().optional(),
});

type MealMediaRow = { storage_path: string; sort_order: number };

type MealDetailRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  ingredients: unknown;
  category: string;
  difficulty: string;
  calories_per_serving: number | string | null;
  protein_g_per_serving: number | string | null;
  carbs_g_per_serving: number | string | null;
  fat_g_per_serving: number | string | null;
  is_public: boolean;
  meal_media: MealMediaRow[] | null;
};

function num(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function fmt(value: number | null, suffix: string) {
  if (value === null) return "—";
  return `${Math.round(value * 10) / 10} ${suffix}`;
}

type MealDetailPageProps = {
  params: Promise<{ mealId: string }>;
};

export default async function MealDetailPage({ params }: MealDetailPageProps) {
  const { mealId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { dict } = await getI18n();

  const { data: row, error } = await supabase
    .from("meals")
    .select(
      `id, owner_id, title, description, instructions, ingredients, category, difficulty,
       calories_per_serving, protein_g_per_serving, carbs_g_per_serving, fat_g_per_serving,
       is_public, meal_media ( storage_path, sort_order )`,
    )
    .eq("id", mealId)
    .maybeSingle();

  if (error || !row) notFound();

  const meal = row as MealDetailRow;
  const canView = meal.is_public || meal.owner_id === user.id;
  if (!canView) notFound();

  const path = firstMealImagePath(meal.meal_media);
  const imageUrl = path ? await getSignedMealImageUrl(supabase, path) : null;

  const [{ data: likeRow }, { data: saveRow }] = await Promise.all([
    supabase
      .from("recipe_likes")
      .select("meal_id")
      .eq("user_id", user.id)
      .eq("meal_id", mealId)
      .maybeSingle(),
    supabase
      .from("recipe_saves")
      .select("meal_id")
      .eq("user_id", user.id)
      .eq("meal_id", mealId)
      .maybeSingle(),
  ]);

  const ingredientsParsed = z
    .array(ingredientEntrySchema)
    .safeParse(meal.ingredients);
  const ingredients = ingredientsParsed.success ? ingredientsParsed.data : [];

  const kcal = num(meal.calories_per_serving);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 pb-24 md:px-6 md:pb-10">
      <Link
        href="/meals/explore"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 gap-1 text-muted-foreground",
        )}
      >
        <ArrowLeft className="size-4" aria-hidden />
        {dict.meals.detail.back}
      </Link>

      <article className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
        <div className="relative aspect-[3/2] w-full bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={meal.title}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 48rem"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              {dict.meals.detail.noImage}
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/35 to-transparent" />
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5">
            <Badge className="rounded-full bg-background/90 text-foreground backdrop-blur">
              {mealCategoryLabel(meal.category, dict.meals.new.category)}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full border-white/30 bg-background/30 text-white backdrop-blur"
            >
              {mealDifficultyLabel(meal.difficulty, dict.meals.new.difficulty)}
            </Badge>
            {!meal.is_public ? (
              <Badge
                variant="outline"
                className="rounded-full border-white/30 bg-background/30 text-white backdrop-blur"
              >
                {dict.common.private}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="space-y-6 p-6 md:p-8">
          <header className="space-y-3">
            <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
              {meal.title}
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              {kcal !== null ? Math.round(kcal) : "—"} {dict.common.kcal}{" "}
              <span className="text-muted-foreground/70">
                / {dict.common.perServing}
              </span>
            </p>
          </header>

          <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-3">
            <MacroTile
              label={dict.dashboard.protein}
              value={fmt(num(meal.protein_g_per_serving), dict.common.grams)}
            />
            <MacroTile
              label={dict.dashboard.carbs}
              value={fmt(num(meal.carbs_g_per_serving), dict.common.grams)}
            />
            <MacroTile
              label={dict.dashboard.fat}
              value={fmt(num(meal.fat_g_per_serving), dict.common.grams)}
            />
          </div>

          {meal.description ? (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
              {meal.description}
            </p>
          ) : null}

          {ingredients.length > 0 ? (
            <section>
              <h2 className="mb-3 font-heading text-lg tracking-tight">
                {dict.meals.detail.ingredients}
              </h2>
              <ul className="space-y-2">
                {ingredients.map((ing, i) => (
                  <li
                    key={`${ing.name}-${i}`}
                    className="flex items-start gap-3 rounded-xl bg-muted/40 px-3 py-2 text-sm"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>
                      <span className="font-medium">{ing.name}</span>
                      {ing.amount || ing.unit ? (
                        <span className="text-muted-foreground">
                          {" "}
                          — {ing.amount ?? ""}
                          {ing.unit ? ` ${ing.unit}` : ""}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {meal.instructions ? (
            <section>
              <h2 className="mb-3 font-heading text-lg tracking-tight">
                {dict.meals.detail.instructions}
              </h2>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                {meal.instructions}
              </p>
            </section>
          ) : null}
        </div>

        {meal.is_public ? (
          <MealSocialBar
            mealId={mealId}
            initialLiked={!!likeRow}
            initialSaved={!!saveRow}
            labels={dict.meals.card}
            className="border-t-0"
          />
        ) : null}
      </article>
    </div>
  );
}

function MacroTile({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-heading text-xl tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}
