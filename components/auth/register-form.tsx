"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validations/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldKey = "email" | "password" | "confirmPassword";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setInfoMessage(null);
    setFieldErrors({});

    const parsed = registerSchema.safeParse({
      email,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      const next: Partial<Record<FieldKey, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "email" || key === "password" || key === "confirmPassword") {
          next[key] = issue.message;
        }
      }
      setFieldErrors(next);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setInfoMessage(
        "Compte créé. Si la confirmation par e-mail est activée, vérifie ta boîte de réception avant de te connecter.",
      );
    } catch {
      setFormError("Une erreur inattendue s’est produite. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscription</CardTitle>
        <CardDescription>Crée un compte pour commencer à suivre tes repas.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {formError ? (
            <p
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {formError}
            </p>
          ) : null}
          {infoMessage ? (
            <p
              className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground"
              role="status"
            >
              {infoMessage}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="register-email">E-mail</Label>
            <Input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={
                fieldErrors.email ? "register-email-error" : undefined
              }
            />
            {fieldErrors.email ? (
              <p id="register-email-error" className="text-sm text-destructive">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">Mot de passe</Label>
            <Input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? "register-password-error" : undefined
              }
            />
            {fieldErrors.password ? (
              <p id="register-password-error" className="text-sm text-destructive">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-confirm">Confirmer le mot de passe</Label>
            <Input
              id="register-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={
                fieldErrors.confirmPassword
                  ? "register-confirm-error"
                  : undefined
              }
            />
            {fieldErrors.confirmPassword ? (
              <p
                id="register-confirm-error"
                className="text-sm text-destructive"
              >
                {fieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={loading}>
            {loading ? "Inscription…" : "S’inscrire"}
          </Button>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "link" }),
              "h-auto px-0 text-center sm:text-right",
            )}
          >
            Déjà un compte ? Se connecter
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
