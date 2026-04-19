import { z } from "zod";

export const bodyProfileFormSchema = z.object({
  sex: z.enum(["male", "female", "other"]),
  age_years: z.coerce
    .number()
    .int("L’âge doit être un nombre entier.")
    .min(14, "Âge minimum 14 ans.")
    .max(100, "Âge maximum 100 ans."),
  height_cm: z.coerce
    .number()
    .int("La taille (cm) doit être un nombre entier.")
    .min(100, "Taille minimum 100 cm.")
    .max(250, "Taille maximum 250 cm."),
  weight_kg: z.coerce
    .number()
    .min(30, "Poids minimum 30 kg.")
    .max(400, "Poids maximum 400 kg."),
  activity_sessions_per_week: z.coerce
    .number()
    .int("Nombre d’activités : valeur entière.")
    .min(0, "Minimum 0.")
    .max(21, "Maximum 21 par semaine."),
  goal_type: z.enum(["lose_weight", "maintain", "gain_mass"]),
});

export type BodyProfileFormValues = z.infer<typeof bodyProfileFormSchema>;
