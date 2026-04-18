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

function formatMacro(label: string, value: number | null, suffix: string) {
  if (value === null) return `${label} —`;
  return `${label} ${Math.round(value * 10) / 10} ${suffix}`;
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

  if (!user) {
    return null;
  }

  const { data: row, error } = await supabase
    .from("meals")
    .select(
      `id, owner_id, title, description, instructions, ingredients, category, difficulty,
       calories_per_serving, protein_g_per_serving, carbs_g_per_serving, fat_g_per_serving,
       is_public, meal_media ( storage_path, sort_order )`,
    )
    .eq("id", mealId)
    .maybeSingle();

  if (error || !row) {
    notFound();
  }

  const meal = row as MealDetailRow;
  const canView = meal.is_public || meal.owner_id === user.id;
  if (!canView) {
    notFound();
  }

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

  const ingredientsParsed = z.array(ingredientEntrySchema).safeParse(meal.ingredients);
  const ingredients = ingredientsParsed.success ? ingredientsParsed.data : [];

  const kcal = num(meal.calories_per_serving);
  const kcalLabel =
    kcal !== null ? `${Math.round(kcal)} kcal / portion` : "— kcal / portion";

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8 pb-24 md:pb-8">
      <Link
        href="/meals/explore"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 gap-1 text-muted-foreground",
        )}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour au fil
      </Link>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="relative aspect-[16/10] w-full bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 42rem"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              Pas d’image
            </div>
          )}
        </div>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{mealCategoryLabel(meal.category)}</Badge>
            <Badge variant="outline">{mealDifficultyLabel(meal.difficulty)}</Badge>
            {!meal.is_public ? (
              <Badge variant="outline">Privé</Badge>
            ) : null}
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {meal.title}
          </h1>
          <p className="text-sm font-medium text-muted-foreground">{kcalLabel}</p>
          <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-3">
            <p>{formatMacro("Prot.", num(meal.protein_g_per_serving), "g")}</p>
            <p>{formatMacro("Gluc.", num(meal.carbs_g_per_serving), "g")}</p>
            <p>{formatMacro("Lip.", num(meal.fat_g_per_serving), "g")}</p>
          </div>
          {meal.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {meal.description}
            </p>
          ) : null}
          {ingredients.length > 0 ? (
            <div>
              <h2 className="mb-2 font-heading text-sm font-semibold">Ingrédients</h2>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {ingredients.map((ing, i) => (
                  <li key={`${ing.name}-${i}`}>
                    <span className="font-medium">{ing.name}</span>
                    {ing.amount || ing.unit ? (
                      <span className="text-muted-foreground">
                        {" "}
                        — {ing.amount ?? ""}
                        {ing.unit ? ` ${ing.unit}` : ""}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {meal.instructions ? (
            <div>
              <h2 className="mb-2 font-heading text-sm font-semibold">Préparation</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {meal.instructions}
              </p>
            </div>
          ) : null}
        </div>
        {meal.is_public ? (
          <MealSocialBar
            mealId={mealId}
            initialLiked={!!likeRow}
            initialSaved={!!saveRow}
            className="rounded-b-xl border-t-0"
          />
        ) : null}
      </div>
    </div>
  );
}
