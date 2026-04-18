type CategoryDict = Partial<Record<string, string>>;
type DifficultyDict = Partial<Record<string, string>>;

const FALLBACK_CATEGORY: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  dessert: "Dessert",
  drink: "Drink",
  other: "Other",
};

const FALLBACK_DIFFICULTY: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function mealCategoryLabel(
  category: string,
  dict?: CategoryDict,
): string {
  return dict?.[category] ?? FALLBACK_CATEGORY[category] ?? category;
}

export function mealDifficultyLabel(
  difficulty: string,
  dict?: DifficultyDict,
): string {
  return dict?.[difficulty] ?? FALLBACK_DIFFICULTY[difficulty] ?? difficulty;
}
