import { Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSignedMealImageUrl } from "@/lib/storage/meal-media";
import { MealCard } from "@/components/meals/meal-card";

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

function firstImagePath(media: MealMediaRow[] | null | undefined): string | null {
  if (!media?.length) return null;
  return [...media].sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path ?? null;
}

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

  if (!user) {
    return null;
  }

  const { data: meals, error } = await supabase
    .from("meals")
    .select(
      "id, title, category, difficulty, calories_per_serving, created_at, meal_media ( storage_path, sort_order )",
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[explore] meals", error.message);
  }

  const list = (meals ?? []) as MealRow[];
  const mealIds = list.map((m) => m.id);

  const [{ data: likesRows }, { data: savesRows }] = await Promise.all([
    mealIds.length
      ? supabase.from("recipe_likes").select("meal_id").eq("user_id", user.id).in("meal_id", mealIds)
      : Promise.resolve({ data: [] as { meal_id: string }[] }),
    mealIds.length
      ? supabase.from("recipe_saves").select("meal_id").eq("user_id", user.id).in("meal_id", mealIds)
      : Promise.resolve({ data: [] as { meal_id: string }[] }),
  ]);

  const likedSet = new Set((likesRows ?? []).map((r) => r.meal_id));
  const savedSet = new Set((savesRows ?? []).map((r) => r.meal_id));

  const cards = await Promise.all(
    list.map(async (m) => {
      const path = firstImagePath(m.meal_media);
      const imageUrl = path
        ? await getSignedMealImageUrl(supabase, path)
        : null;
      return {
        mealId: m.id,
        title: m.title,
        category: m.category,
        difficulty: m.difficulty,
        calories: num(m.calories_per_serving),
        imageUrl,
        initialLiked: likedSet.has(m.id),
        initialSaved: savedSet.has(m.id),
      };
    }),
  );

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Compass className="size-5" aria-hidden />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Découvrir des repas
          </h1>
          <p className="text-sm text-muted-foreground">
            Recettes publiées par la communauté.
          </p>
        </div>
      </header>

      {cards.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Aucun repas public pour le moment. Publie le tien depuis « Enregistrer un repas ».
        </p>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <li key={c.mealId}>
              <MealCard {...c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
