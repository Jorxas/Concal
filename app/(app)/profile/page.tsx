import { format } from "date-fns";
import { Bookmark, ChefHat, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSignedMealImageUrl } from "@/lib/storage/meal-media";
import { firstMealImagePath } from "@/lib/meals/media";
import { SavedMealRow } from "@/components/profile/saved-meal-row";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { getI18n } from "@/lib/i18n/server";
import { dateLocaleFor } from "@/lib/i18n/date";
import { mealCategoryLabel } from "@/lib/meals/labels";

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

type OwnedRow = {
  id: string;
  title: string;
  category: string;
  is_public: boolean;
  calories_per_serving: number | string | null;
  created_at: string;
  meal_media: MealMedia[] | null;
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

function initialsFromEmail(email: string | null): string {
  if (!email) return "?";
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? local[0] ?? "?";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.slice(0, 2).toUpperCase();
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { dict, locale } = await getI18n();
  const dateLocale = dateLocaleFor(locale);
  const categoryDict = dict.meals.new.category;

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

  const [{ data: savesRaw }, { data: ownedRaw }] = await Promise.all([
    supabase
      .from("recipe_saves")
      .select(
        `created_at, meal_id, meals ( id, title, category, calories_per_serving, meal_media ( storage_path, sort_order ) )`,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("meals")
      .select(
        "id, title, category, is_public, calories_per_serving, created_at, meal_media ( storage_path, sort_order )",
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const saves = (savesRaw ?? []) as SaveRow[];
  const owned = (ownedRaw ?? []) as OwnedRow[];

  const savedItems = await Promise.all(
    saves.map(async (row) => {
      const meal = asMeal(row.meals);
      if (!meal) return null;
      const path = firstMealImagePath(meal.meal_media);
      const imageUrl = path ? await getSignedMealImageUrl(supabase, path) : null;
      const metaLabel = format(new Date(row.created_at), "d MMM yyyy", {
        locale: dateLocale,
      });
      return {
        key: `${row.meal_id}-${row.created_at}`,
        mealId: meal.id,
        title: meal.title,
        categoryLabel: mealCategoryLabel(meal.category, categoryDict),
        calories: num(meal.calories_per_serving),
        imageUrl,
        metaLabel,
      };
    }),
  );
  const savedList = savedItems.filter(Boolean) as NonNullable<
    (typeof savedItems)[number]
  >[];

  const ownedItems = await Promise.all(
    owned.map(async (row) => {
      const path = firstMealImagePath(row.meal_media);
      const imageUrl = path ? await getSignedMealImageUrl(supabase, path) : null;
      const metaLabel = format(new Date(row.created_at), "d MMM yyyy", {
        locale: dateLocale,
      });
      const visibility = row.is_public ? dict.common.public : dict.common.private;
      return {
        key: row.id,
        mealId: row.id,
        title: row.title,
        categoryLabel: mealCategoryLabel(row.category, categoryDict),
        calories: num(row.calories_per_serving),
        imageUrl,
        metaLabel: `${metaLabel} · ${visibility}`,
      };
    }),
  );

  const initials = initialsFromEmail(user.email ?? null);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-4 py-8 pb-24 md:px-8 md:py-10 md:pb-10">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 font-heading text-xl font-semibold text-primary"
          >
            {initials}
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              {dict.profile.title}
            </p>
            <h1 className="mt-0.5 font-heading text-2xl tracking-tight md:text-3xl">
              {user.email}
            </h1>
            <p className="text-sm text-muted-foreground">
              {dict.profile.subtitle}
            </p>
          </div>
        </div>
        <LocaleSwitcher current={locale} />
      </section>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          {dict.profile.title}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            icon={<ChefHat className="size-4" aria-hidden />}
            label={dict.profile.stats.meals}
            value={mealsOwned ?? 0}
          />
          <StatTile
            icon={<Globe className="size-4" aria-hidden />}
            label={dict.profile.stats.public}
            value={mealsPublic ?? 0}
          />
          <StatTile
            icon={<Bookmark className="size-4" aria-hidden />}
            label={dict.profile.stats.saves}
            value={savesTotal ?? 0}
          />
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="saved-heading">
        <h2 id="saved-heading" className="font-heading text-xl tracking-tight">
          {dict.profile.saved}
        </h2>
        {savedList.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {dict.profile.savedEmpty}
          </p>
        ) : (
          <ul className="space-y-2">
            {savedList.map((item) => (
              <li key={item.key}>
                <SavedMealRow
                  mealId={item.mealId}
                  title={item.title}
                  categoryLabel={item.categoryLabel}
                  calories={item.calories}
                  imageUrl={item.imageUrl}
                  metaLabel={item.metaLabel}
                  kcalUnit={dict.common.kcal}
                  noImageLabel={dict.meals.card.noImage}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="mine-heading">
        <h2 id="mine-heading" className="font-heading text-xl tracking-tight">
          {dict.profile.mine}
        </h2>
        {ownedItems.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {dict.profile.mineEmpty}
          </p>
        ) : (
          <ul className="space-y-2">
            {ownedItems.map((item) => (
              <li key={item.key}>
                <SavedMealRow
                  mealId={item.mealId}
                  title={item.title}
                  categoryLabel={item.categoryLabel}
                  calories={item.calories}
                  imageUrl={item.imageUrl}
                  metaLabel={item.metaLabel}
                  kcalUnit={dict.common.kcal}
                  noImageLabel={dict.meals.card.noImage}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-primary">
        <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
          {icon}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-3 font-heading text-3xl tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}
