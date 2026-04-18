import { z } from "zod";

/** Connexion : e-mail + mot de passe. */
export const loginSchema = z.object({
  email: z.email("Adresse e-mail invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

/** Inscription : e-mail, mot de passe et confirmation. */
export const registerSchema = z
  .object({
    email: z.email("Adresse e-mail invalide."),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string().min(1, "Confirmez le mot de passe."),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Les mots de passe ne correspondent pas.",
        path: ["confirmPassword"],
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
