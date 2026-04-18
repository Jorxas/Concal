import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

function LoginFormFallback() {
  return (
    <div
      className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground"
      aria-busy="true"
    >
      Chargement du formulaire…
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
