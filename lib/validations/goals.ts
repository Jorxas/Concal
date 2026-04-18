import { z } from "zod";

/** Objectifs journaliers enregistrés dans `user_goals`. */
export const userGoalFormSchema = z.object({
  target_calories: z.coerce
    .number()
    .int("Les calories doivent être un nombre entier.")
    .positive("Les calories doivent être supérieures à 0.")
    .max(20000, "Valeur trop élevée."),
  target_protein_g: z.coerce
    .number()
    .min(0, "Les protéines ne peuvent pas être négatives.")
    .max(1000, "Valeur trop élevée."),
  target_carbs_g: z.coerce
    .number()
    .min(0, "Les glucides ne peuvent pas être négatifs.")
    .max(1000, "Valeur trop élevée."),
  target_fat_g: z.coerce
    .number()
    .min(0, "Les lipides ne peuvent pas être négatifs.")
    .max(1000, "Valeur trop élevée."),
});

export type UserGoalFormInput = z.infer<typeof userGoalFormSchema>;
