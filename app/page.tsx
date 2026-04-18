import Link from "next/link";
import { redirect } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <UtensilsCrossed className="size-8" aria-hidden />
      </div>
      <div className="max-w-md space-y-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Concal
        </h1>
        <p className="text-muted-foreground">
          Suivi des calories, repas et objectifs du jour. Connecte-toi pour accéder
          à ton tableau de bord ou crée un compte pour commencer.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/login"
          className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
        >
          Connexion
        </Link>
        <Link
          href="/register"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full sm:w-auto",
          )}
        >
          Créer un compte
        </Link>
      </div>
    </main>
  );
}
