import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Bookmark, ChefHat, Globe, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSignedMealImageUrl } from "@/lib/storage/meal-media";
import { firstMealImagePath } from "@/lib/meals/media";
import { SavedMealRow } from "@/components/profile/saved-meal-row";

type MealMedia = { storage_path: string; sort_order: number };

type MealNested = {
  id: string;
  title: string;
  category: string;
  calories_per_serving: number | string | null;
  meal_media: MealMedia[] | null;
};

type SaveRow = {
  created_at: string;
  meal_id: string;
  meals: MealNested | MealNested[] | null;
};

function asMeal(m: MealNested | MealNested[] | null): MealNested | null {
  if (!m) return null;
  return Array.isArray(m) ? m[0] ?? null : m;
}

function num(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ count: mealsOwned }, { count: mealsPublic }, { count: savesTotal }] =
    await Promise.all([
      supabase
        .from("meals")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id),
      supabase
        .from("meals")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id)
        .eq("is_public", true),
      supabase
        .from("recipe_saves")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

  const { data: savesRaw } = await supabase
    .from("recipe_saves")
    .select(
      `created_at, meal_id, meals ( id, title, category, calories_per_serving, meal_media ( storage_path, sort_order ) )`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const saves = (savesRaw ?? []) as SaveRow[];

  const savedItems = await Promise.all(
    saves.map(async (row) => {
      const meal = asMeal(row.meals);
      if (!meal) {
        return null;
      }
      const path = firstMealImagePath(meal.meal_media);
      const imageUrl = path ? await getSignedMealImageUrl(supabase, path) : null;
      const savedAtLabel = format(new Date(row.created_at), "d MMM yyyy", {
        locale: fr,
      });
      return {
        saveKey: `${row.meal_id}-${row.created_at}`,
        mealId: meal.id,
        title: meal.title,
        category: meal.category,
        calories: num(meal.calories_per_serving),
        imageUrl,
        savedAtLabel,
      };
    }),
  );

  const savedList = savedItems.filter(Boolean) as NonNullable<
    (typeof savedItems)[number]
  >[];

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-10 px-4 py-8 pb-24 md:pb-8">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserRound className="size-5" aria-hidden />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Profil
          </h1>
          <p className="text-sm text-muted-foreground">
            Statistiques et recettes enregistrées.
          </p>
        </div>
      </header>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Statistiques
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ChefHat className="size-4" aria-hidden />
              <span className="text-xs font-medium uppercase">Repas créés</span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {mealsOwned ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="size-4" aria-hidden />
              <span className="text-xs font-medium uppercase">Publics</span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {mealsPublic ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bookmark className="size-4" aria-hidden />
              <span className="text-xs font-medium uppercase">Favoris</span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {savesTotal ?? 0}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="saved-heading">
        <h2 id="saved-heading" className="font-heading text-lg font-semibold">
          Recettes enregistrées
        </h2>
        {savedList.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aucune recette dans tes favoris pour l’instant. Explore le fil et
            enregistre-en une avec l’icône marque-page.
          </p>
        ) : (
          <ul className="space-y-2">
            {savedList.map((item) => (
              <li key={item.saveKey}>
                <SavedMealRow
                  mealId={item.mealId}
                  title={item.title}
                  category={item.category}
                  calories={item.calories}
                  imageUrl={item.imageUrl}
                  savedAtLabel={item.savedAtLabel}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
