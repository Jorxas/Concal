import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { z } from "zod";
import { buttonVariants } from "@/components/ui/button";
import {
  MealUploadForm,
  type MealUploadEditConfig,
} from "@/components/meals/meal-upload-form";
import { createClient } from "@/lib/supabase/server";
import { getSignedMealImageUrl } from "@/lib/storage/meal-media";
import { firstMealImagePath } from "@/lib/meals/media";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

const ingredientEntrySchema = z.object({
  name: z.string(),
  amount: z.string().optional(),
  unit: z.string().optional(),
});

type MealMediaRow = { storage_path: string; sort_order: number };

type MealEditRow = {
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
  cooking_video_url: string | null;
  meal_media: MealMediaRow[] | null;
};

function num(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function strMacro(v: string | number | null | undefined): string {
  const n = num(v);
  return n !== null ? String(n) : "";
}

type MealEditPageProps = {
  params: Promise<{ mealId: string }>;
};

export default async function MealEditPage({ params }: MealEditPageProps) {
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
       is_public, cooking_video_url, meal_media ( storage_path, sort_order )`,
    )
    .eq("id", mealId)
    .maybeSingle();

  if (error || !row) notFound();

  const meal = row as MealEditRow;
  if (meal.owner_id !== user.id) notFound();

  const path = firstMealImagePath(meal.meal_media);
  const existingImageUrl = path
    ? await getSignedMealImageUrl(supabase, path)
    : null;

  const ingredientsParsed = z
    .array(ingredientEntrySchema)
    .safeParse(meal.ingredients);
  const ingredients = ingredientsParsed.success ? ingredientsParsed.data : [];

  const edit: MealUploadEditConfig = {
    mealId: meal.id,
    existingImageUrl,
    title: meal.title,
    description: meal.description ?? "",
    instructions: meal.instructions ?? "",
    ingredients,
    category: meal.category,
    difficulty: meal.difficulty,
    calories: strMacro(meal.calories_per_serving),
    protein: strMacro(meal.protein_g_per_serving),
    carbs: strMacro(meal.carbs_g_per_serving),
    fat: strMacro(meal.fat_g_per_serving),
    isPublic: meal.is_public,
    cookingVideoUrl: meal.cooking_video_url ?? "",
  };

  const formDict = { ...dict.meals.new, cancel: dict.common.cancel };

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-8 md:px-8 md:py-10">
      <div>
        <Link
          href={`/meals/${mealId}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 gap-1 px-2 text-muted-foreground",
          )}
        >
          <ChevronLeft className="size-4" aria-hidden />
          {dict.meals.edit.back}
        </Link>
        <h1 className="mt-3 font-heading text-3xl tracking-tight md:text-4xl">
          {dict.meals.edit.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dict.meals.edit.subtitle}
        </p>
      </div>
      <MealUploadForm dict={formDict} edit={edit} />
    </div>
  );
}
