import { format } from "date-fns";
import { Bookmark, ChefHat, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(app)/actions";
import { getSignedAvatarUrl } from "@/lib/storage/avatar";
import { getSignedMealImageUrl } from "@/lib/storage/meal-media";
import { firstMealImagePath } from "@/lib/meals/media";
import { SavedMealRow } from "@/components/profile/saved-meal-row";
import { ProfileAvatarPicker } from "@/components/profile/profile-avatar-picker";
import {
  NutritionProfileForm,
  type NutritionProfileRow,
} from "@/components/profile/nutrition-profile-form";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Button } from "@/components/ui/button";
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

  const [
    { count: mealsOwned },
    { count: mealsPublic },
    { count: savesTotal },
    profileResult,
  ] = await Promise.all([
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
      supabase
        .from("user_body_profile")
        .select(
          "sex, age_years, height_cm, weight_kg, activity_sessions_per_week, goal_type",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const bodyProfileRow = profileResult.error ? null : profileResult.data;

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
  const rawAvatar = user.user_metadata?.avatar_storage_path;
  const avatarPath =
    typeof rawAvatar === "string" && rawAvatar.length > 0 ? rawAvatar : null;
  const avatarSignedUrl = avatarPath
    ? await getSignedAvatarUrl(supabase, avatarPath)
    : null;

  const nutritionInitial: NutritionProfileRow | null = (() => {
    if (!bodyProfileRow) return null;
    const sex = bodyProfileRow.sex;
    const goal = bodyProfileRow.goal_type;
    if (sex !== "male" && sex !== "female" && sex !== "other") return null;
    if (goal !== "lose_weight" && goal !== "maintain" && goal !== "gain_mass") {
      return null;
    }
    return {
      sex,
      age_years: Number(bodyProfileRow.age_years),
      height_cm: Number(bodyProfileRow.height_cm),
      weight_kg: Number(bodyProfileRow.weight_kg),
      activity_sessions_per_week: Number(
        bodyProfileRow.activity_sessions_per_week,
      ),
      goal_type: goal,
    };
  })();

  const nutritionDict = {
    title: dict.profile.nutrition.title,
    subtitle: dict.profile.nutrition.subtitle,
    disclaimer: dict.profile.nutrition.disclaimer,
    sexLabel: dict.profile.nutrition.sexLabel,
    sexMale: dict.profile.nutrition.sexMale,
    sexFemale: dict.profile.nutrition.sexFemale,
    sexOther: dict.profile.nutrition.sexOther,
    ageLabel: dict.profile.nutrition.ageLabel,
    heightLabel: dict.profile.nutrition.heightLabel,
    weightLabel: dict.profile.nutrition.weightLabel,
    activityLabel: dict.profile.nutrition.activityLabel,
    activityHelp: dict.profile.nutrition.activityHelp,
    goalLabel: dict.profile.nutrition.goalLabel,
    goalLose: dict.profile.nutrition.goalLose,
    goalMaintain: dict.profile.nutrition.goalMaintain,
    goalGain: dict.profile.nutrition.goalGain,
    submit: dict.profile.nutrition.submit,
    saving: dict.profile.nutrition.saving,
    successToast: dict.profile.nutrition.successToast,
    afterSaveHint: dict.profile.nutrition.afterSaveHint,
  };

  const avatarPickerDict = {
    avatarAlt: dict.profile.avatarAlt,
    avatarMenuAria: dict.profile.avatarMenuAria,
    avatarSheetTitle: dict.profile.avatarSheetTitle,
    avatarView: dict.profile.avatarView,
    avatarPickAction: dict.profile.avatarPickAction,
    avatarRemove: dict.profile.avatarRemove,
    avatarCancel: dict.profile.avatarCancel,
    avatarRemoveTitle: dict.profile.avatarRemoveTitle,
    avatarRemoveBody: dict.profile.avatarRemoveBody,
    avatarRemoveConfirm: dict.profile.avatarRemoveConfirm,
    avatarSuccess: dict.profile.avatarSuccess,
    avatarRemoved: dict.profile.avatarRemoved,
  };

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-4 py-8 pb-24 md:px-8 md:py-10 md:pb-10">
      <section className="space-y-5 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <ProfileAvatarPicker
              avatarSignedUrl={avatarSignedUrl}
              initials={initials}
              dict={avatarPickerDict}
            />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                {dict.profile.title}
              </p>
              <h1 className="mt-0.5 break-all font-heading text-2xl tracking-tight md:text-3xl">
                {user.email}
              </h1>
              <p className="text-sm text-muted-foreground">
                {dict.profile.subtitle}
              </p>
            </div>
          </div>
          <LocaleSwitcher current={locale} />
        </div>

        <form action={signOut}>
          <Button
            type="submit"
            variant="outline"
            className="h-10 w-full rounded-full sm:w-auto"
          >
            {dict.profile.signOutButton}
          </Button>
        </form>
      </section>

      <NutritionProfileForm initial={nutritionInitial} dict={nutritionDict} />

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
