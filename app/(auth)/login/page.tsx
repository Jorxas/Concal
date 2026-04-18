import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { getI18n } from "@/lib/i18n/server";

function LoginFormFallback({ label }: { label: string }) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground"
      aria-busy="true"
    >
      {label}
    </div>
  );
}

export default async function LoginPage() {
  const { dict } = await getI18n();
  const formDict = {
    ...dict.auth.login,
    unexpected: dict.auth.unexpected,
    loginErrors: dict.auth.loginErrors,
  };

  return (
    <Suspense fallback={<LoginFormFallback label={dict.common.loading} />}>
      <LoginForm dict={formDict} />
    </Suspense>
  );
}
