import Link from "next/link";
import {
  Camera,
  LayoutGrid,
  Sparkles,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ctaHref = user ? "/dashboard" : "/register";
  const ctaLabel = user ? "Open dashboard" : "Get Started";

  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b border-border/80 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <UtensilsCrossed className="size-4" aria-hidden />
            </span>
            Concal
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
                App
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Connexion
                </Link>
                <Link href="/register" className={buttonVariants({ size: "sm" })}>
                  Inscription
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center md:py-24">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">
          Nutrition & communauté
        </p>
        <h1 className="max-w-3xl font-heading text-3xl font-semibold tracking-tight text-balance md:text-5xl">
          AI-Powered Calorie Tracking &amp; Social Recipe Sharing
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground text-pretty md:text-xl">
          Enregistre tes repas avec photo, laisse l’IA estimer les macros, fixe tes
          objectifs du jour et découvre des recettes publiées par d’autres passionnés.
        </p>
        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={ctaHref}
            className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
          >
            {ctaLabel}
          </Link>
          {!user ? (
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              J’ai déjà un compte
            </Link>
          ) : null}
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-3 md:gap-8">
          <div className="rounded-xl border border-border bg-card p-6 text-left shadow-sm">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-5" aria-hidden />
            </div>
            <h2 className="font-heading text-lg font-semibold">Vision par IA</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Une photo suffit pour préremplir titre, ingrédients et estimation
              calorique avec Gemini.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 text-left shadow-sm">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LayoutGrid className="size-5" aria-hidden />
            </div>
            <h2 className="font-heading text-lg font-semibold">Tableau de bord</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Objectifs journaliers, macros et apports du jour sur une vue claire.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 text-left shadow-sm">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-5" aria-hidden />
            </div>
            <h2 className="font-heading text-lg font-semibold">Fil social</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Publie tes recettes, parcours celles des autres, like et enregistre tes
              favoris.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:flex md:items-center md:justify-between md:py-20">
        <div className="max-w-xl space-y-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Camera className="size-5" aria-hidden />
          </div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Prêt à suivre tes repas ?
          </h2>
          <p className="text-muted-foreground">
            Crée un compte gratuit, connecte Supabase et commence en quelques minutes.
          </p>
        </div>
        <div className="mt-8 flex shrink-0 flex-col gap-3 md:mt-0 md:items-end">
          <Link href={ctaHref} className={cn(buttonVariants({ size: "lg" }))}>
            {ctaLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
