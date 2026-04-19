import { z } from "zod";

export const MEAL_CATEGORIES = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "dessert",
  "drink",
  "other",
] as const;

export const MEAL_DIFFICULTIES = ["easy", "medium", "hard"] as const;

const ingredientEntrySchema = z.object({
  name: z.string().min(1),
  amount: z.string().optional(),
  unit: z.string().optional(),
});

/** Parse le champ texte JSON « ingrédients » depuis le formulaire. */
export function parseIngredientsJson(raw: string): {
  ok: true;
  value: z.infer<typeof ingredientEntrySchema>[];
} | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, value: [] };
  }
  try {
    const data: unknown = JSON.parse(trimmed);
    if (!Array.isArray(data)) {
      return { ok: false, message: "Les ingrédients doivent être un tableau JSON." };
    }
    const parsed = z.array(ingredientEntrySchema).safeParse(data);
    if (!parsed.success) {
      return {
        ok: false,
        message:
          "Chaque ingrédient doit avoir au minimum un nom (ex. [{\"name\":\"Œufs\",\"amount\":\"2\",\"unit\":\"pcs\"}]).",
      };
    }
    return { ok: true, value: parsed.data };
  } catch {
    return { ok: false, message: "JSON des ingrédients invalide." };
  }
}

export const createMealFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(200),
  description: z
    .string()
    .trim()
    .max(8000)
    .optional()
    .transform((s) => (s === "" ? undefined : s)),
  instructions: z
    .string()
    .trim()
    .max(20000)
    .optional()
    .transform((s) => (s === "" ? undefined : s)),
  category: z.enum(MEAL_CATEGORIES),
  difficulty: z.enum(MEAL_DIFFICULTIES),
  calories_per_serving: z.coerce
    .number()
    .positive("Les calories doivent être > 0.")
    .max(20000),
  protein_g_per_serving: z.coerce
    .number()
    .min(0)
    .max(2000),
  carbs_g_per_serving: z.coerce
    .number()
    .min(0)
    .max(2000),
  fat_g_per_serving: z.coerce.number().min(0).max(2000),
  cooking_video_url: z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => (v == null ? "" : String(v)).trim())
    .pipe(
      z.union([
        z.literal(""),
        z
          .string()
          .max(2000, "Le lien est trop long.")
          .url("Indique une URL valide (https://…)."),
      ]),
    )
    .transform((s) => (s === "" ? null : s)),
});

export type CreateMealFormValues = z.infer<typeof createMealFormSchema>;
