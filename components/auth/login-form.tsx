"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSafeReturnPath } from "@/lib/auth/return-path";
import { loginSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/password-field";
import type { PasswordFieldLabels } from "@/components/auth/password-field";

export type LoginFormDict = {
  title: string;
  subtitle: string;
  emailLabel: string;
  passwordLabel: string;
  submit: string;
  submitLoading: string;
  noAccount: string;
  register: string;
  unexpected: string;
  passwordToggle: PasswordFieldLabels;
  oauth: {
    continueWithGoogle: string;
    divider: string;
    error: string;
  };
  loginErrors: {
    authCallback: string;
    invalidCredentials: string;
    emailNotConfirmed: string;
  };
};

function mapSignInError(
  message: string,
  loginErrors: LoginFormDict["loginErrors"],
): string {
  const m = message.toLowerCase();
  if (m.includes("email not confirmed")) {
    return loginErrors.emailNotConfirmed;
  }
  if (
    m.includes("invalid login credentials") ||
    m.includes("invalid email or password")
  ) {
    return loginErrors.invalidCredentials;
  }
  return message;
}

export function LoginForm({ dict }: { dict: LoginFormDict }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = useMemo(
    () => getSafeReturnPath(searchParams.get("next")),
    [searchParams],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"email" | "password", string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "auth_callback") {
      setFormError(dict.loginErrors.authCallback);
    }
  }, [searchParams, dict.loginErrors]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const next: Partial<Record<"email" | "password", string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "email" || key === "password") {
          next[key] = issue.message;
        }
      }
      setFieldErrors(next);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        setFormError(mapSignInError(error.message, dict.loginErrors));
        return;
      }

      router.push(returnTo);
      router.refresh();
    } catch {
      setFormError(dict.unexpected);
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleSignIn() {
    setFormError(null);
    setOauthLoading(true);
    try {
      const supabase = createClient();
      const next = returnTo.startsWith("/") ? returnTo : "/dashboard";
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setFormError(dict.oauth.error);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setFormError(dict.oauth.error);
    } finally {
      setOauthLoading(false);
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

        <div className="space-y-2">
          <Label htmlFor="login-email">{dict.emailLabel}</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            className="h-11"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={
              fieldErrors.email ? "login-email-error" : undefined
            }
          />
          {fieldErrors.email ? (
            <p id="login-email-error" className="text-sm text-destructive">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">{dict.passwordLabel}</Label>
          <PasswordField
            id="login-password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            disabled={loading || oauthLoading}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "login-password-error" : undefined
            }
            labels={dict.passwordToggle}
          />
          {fieldErrors.password ? (
            <p id="login-password-error" className="text-sm text-destructive">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={loading || oauthLoading}
          className="h-11 w-full rounded-full text-sm font-medium"
        >
          {loading ? dict.submitLoading : dict.submit}
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <span className="w-full border-t border-border/80" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide">
            <span className="bg-card px-2 text-muted-foreground">
              {dict.oauth.divider}
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={loading || oauthLoading}
          className="h-11 w-full rounded-full text-sm font-medium"
          onClick={() => void onGoogleSignIn()}
        >
          {oauthLoading ? dict.submitLoading : dict.oauth.continueWithGoogle}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {dict.noAccount}{" "}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {dict.register}
        </Link>
      </p>
    </div>
  );
}
