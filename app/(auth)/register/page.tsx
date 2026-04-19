import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";
import { getI18n } from "@/lib/i18n/server";

function RegisterFormFallback({ label }: { label: string }) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground"
      aria-busy="true"
    >
      {label}
    </div>
  );
}

export default async function RegisterPage() {
  const { dict } = await getI18n();
  const formDict = {
    ...dict.auth.register,
    unexpected: dict.auth.unexpected,
    passwordToggle: dict.auth.passwordToggle,
    oauth: dict.auth.oauth,
  };

  return (
    <Suspense fallback={<RegisterFormFallback label={dict.common.loading} />}>
      <RegisterForm dict={formDict} />
    </Suspense>
  );
}
