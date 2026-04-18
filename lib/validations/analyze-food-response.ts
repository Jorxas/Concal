import { z } from "zod";

/** Réponse attendue du modèle (identique au contrat API / formulaire). */
export const analyzeFoodResponseSchema = z.object({
  title: z.string().min(1),
  ingredients: z.array(
    z.object({
      name: z.string().min(1),
      amount: z
        .union([z.string(), z.number()])
        .optional()
        .transform((v) =>
          v === undefined || v === null ? "" : String(v),
        ),
      unit: z
        .union([z.string(), z.number()])
        .optional()
        .transform((v) =>
          v === undefined || v === null ? "" : String(v),
        ),
    }),
  ),
  calories: z.coerce.number().finite().nonnegative(),
  protein: z.coerce.number().finite().nonnegative(),
  carbs: z.coerce.number().finite().nonnegative(),
  fat: z.coerce.number().finite().nonnegative(),
  description: z.string(),
});

export type AnalyzeFoodResponse = z.infer<typeof analyzeFoodResponseSchema>;
