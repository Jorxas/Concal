/** Libellés FR pour les enums `meal_category` / `difficulty_level`. */

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: "Petit-déj.",
  lunch: "Déjeuner",
  dinner: "Dîner",
  snack: "Collation",
  dessert: "Dessert",
  drink: "Boisson",
  other: "Autre",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile",
};

export function mealCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function mealDifficultyLabel(difficulty: string): string {
  return DIFFICULTY_LABELS[difficulty] ?? difficulty;
}
