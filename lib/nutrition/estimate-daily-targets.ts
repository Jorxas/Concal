/** Données nécessaires au calcul (évite dépendance DB côté client si besoin). */
export type BodyProfileForEstimate = {
  sex: "male" | "female" | "other";
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activitySessionsPerWeek: number;
  goalType: "lose_weight" | "maintain" | "gain_mass";
};

export type EstimatedDailyTargets = {
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
};

/** Facteur d’activité à partir du nombre de séances / activités structurées par semaine (approx. PAL). */
export function activityFactorFromSessionsPerWeek(sessions: number): number {
  const n = Math.max(0, Math.min(21, Math.round(sessions)));
  if (n <= 0) return 1.2;
  if (n <= 2) return 1.375;
  if (n <= 4) return 1.55;
  if (n <= 6) return 1.725;
  return 1.9;
}

/** BMR (Mifflin–St Jeor), kcal/j. */
export function basalMetabolicRateKcal(input: BodyProfileForEstimate): number {
  const w = input.weightKg;
  const h = input.heightCm;
  const a = input.ageYears;
  const base = 10 * w + 6.25 * h - 5 * a;
  if (input.sex === "male") return base + 5;
  if (input.sex === "female") return base - 161;
  return base - 78;
}

function minSafeCaloriesKcal(sex: BodyProfileForEstimate["sex"]): number {
  if (sex === "female") return 1200;
  if (sex === "male") return 1500;
  return 1325;
}

function targetCaloriesFromTdee(
  tdee: number,
  goal: BodyProfileForEstimate["goalType"],
  sex: BodyProfileForEstimate["sex"],
): number {
  const minK = minSafeCaloriesKcal(sex);
  const maxK = 4500;
  let raw: number;
  if (goal === "lose_weight") {
    raw = Math.round(tdee * 0.8);
    raw = Math.min(raw, Math.round(tdee - 300));
  } else if (goal === "gain_mass") {
    raw = Math.round(tdee * 1.12);
    raw = Math.max(raw, Math.round(tdee + 250));
  } else {
    raw = Math.round(tdee);
  }
  return Math.min(maxK, Math.max(minK, raw));
}

function proteinPerKg(goal: BodyProfileForEstimate["goalType"]): number {
  if (goal === "lose_weight") return 2;
  if (goal === "gain_mass") return 1.8;
  return 1.6;
}

/**
 * Estime calories + macros journaliers à partir du profil.
 * Heuristique simple (pas un avis médical).
 */
export function estimateDailyTargets(
  input: BodyProfileForEstimate,
): EstimatedDailyTargets {
  const bmr = basalMetabolicRateKcal(input);
  const factor = activityFactorFromSessionsPerWeek(
    input.activitySessionsPerWeek,
  );
  const tdee = bmr * factor;
  const target_calories = targetCaloriesFromTdee(tdee, input.goalType, input.sex);

  const pk = proteinPerKg(input.goalType);
  let target_protein_g = Math.round(input.weightKg * pk * 10) / 10;
  target_protein_g = Math.min(220, Math.max(50, target_protein_g));

  let target_fat_g = Math.round((target_calories * 0.27) / 9);
  target_fat_g = Math.min(180, Math.max(35, target_fat_g));

  let carbKcal =
    target_calories - target_protein_g * 4 - target_fat_g * 9;
  if (carbKcal < target_calories * 0.12) {
    target_fat_g = Math.round(
      Math.max(30, (target_calories - target_protein_g * 4 - 0.15 * target_calories) / 9),
    );
    carbKcal =
      target_calories - target_protein_g * 4 - target_fat_g * 9;
  }
  let target_carbs_g = Math.round(Math.max(40, carbKcal / 4));

  const totalK =
    target_protein_g * 4 + target_carbs_g * 4 + target_fat_g * 9;
  const drift = target_calories - totalK;
  if (Math.abs(drift) >= 8) {
    target_carbs_g = Math.round(
      Math.max(30, target_carbs_g + drift / 4),
    );
  }

  return {
    target_calories,
    target_protein_g: Math.round(target_protein_g * 10) / 10,
    target_carbs_g: Math.round(target_carbs_g * 10) / 10,
    target_fat_g: Math.round(target_fat_g * 10) / 10,
  };
}
