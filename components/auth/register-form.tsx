"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldKey = "email" | "password" | "confirmPassword";

export type RegisterFormDict = {
  title: string;
  subtitle: string;
  emailLabel: string;
  passwordLabel: string;
  confirmPasswordLabel: string;
  submit: string;
  submitLoading: string;
  haveAccount: string;
  signIn: string;
  confirmInfo: string;
  unexpected: string;
};

export function RegisterForm({ dict }: { dict: RegisterFormDict }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldKey, string>>
  >({});
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
        if (
          key === "email" ||
          key === "password" ||
          key === "confirmPassword"
        ) {
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

      setInfoMessage(dict.confirmInfo);
    } catch {
      setFormError(dict.unexpected);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl tracking-tight md:text-5xl">
          {dict.title}
        </h1>
        <p className="text-muted-foreground">{dict.subtitle}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {formError ? (
          <p
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {formError}
          </p>
        ) : null}
        {infoMessage ? (
          <p
            className="rounded-lg border border-border bg-muted/60 px-3 py-2 text-sm text-foreground"
            role="status"
          >
            {infoMessage}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="register-email">{dict.emailLabel}</Label>
          <Input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            className="h-11"
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
          <Label htmlFor="register-password">{dict.passwordLabel}</Label>
          <Input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            className="h-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "register-password-error" : undefined
            }
          />
          {fieldErrors.password ? (
            <p
              id="register-password-error"
              className="text-sm text-destructive"
            >
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-confirm">
            {dict.confirmPasswordLabel}
          </Label>
          <Input
            id="register-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="h-11"
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

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-full text-sm font-medium"
        >
          {loading ? dict.submitLoading : dict.submit}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {dict.haveAccount}{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {dict.signIn}
        </Link>
      </p>
    </div>
  );
}
