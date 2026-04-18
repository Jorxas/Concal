import Link from "next/link";
import {
  ArrowRight,
  Database,
  LayoutGrid,
  Sparkles,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";
import { Logo } from "@/components/marketing/logo";
import { HeroMockup } from "@/components/marketing/hero-mockup";
import { FeatureRow } from "@/components/marketing/feature-row";
import {
  AIFeatureVisual,
  DashboardFeatureVisual,
  SocialFeatureVisual,
} from "@/components/marketing/feature-visuals";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { dict, locale } = await getI18n();

  const ctaHref = user ? "/dashboard" : "/register";
  const ctaLabel = user
    ? dict.landing.heroCtaSignedIn
    : dict.landing.heroCtaPrimary;
  const year = new Date().getFullYear();
  const legal = dict.landing.footer.legal.replace("{year}", String(year));

  return (
    <main className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/" aria-label={dict.common.brand}>
            <Logo />
          </Link>
          <nav className="flex items-center gap-1.5 md:gap-2">
            <LocaleSwitcher current={locale} variant="compact" />
            {user ? (
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-10 rounded-full px-4 text-sm",
                )}
              >
                {dict.landing.header.app}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "lg" }),
                    "h-10 rounded-full px-3 text-sm md:px-4",
                  )}
                >
                  {dict.landing.header.signIn}
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-10 rounded-full px-4 text-sm",
                  )}
                >
                  {dict.landing.header.signUp}
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="bg-emerald-gradient relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 size-[720px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-[1.05fr_1fr] md:gap-16 md:px-8 md:py-24">
          <div className="space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium tracking-wide text-primary uppercase">
              <Sparkles className="size-3.5" aria-hidden />
              {dict.landing.eyebrow}
            </span>
            <h1 className="font-heading text-4xl leading-[1.05] tracking-tight text-balance md:text-6xl lg:text-7xl">
              {dict.landing.heroTitle}
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground text-pretty md:text-xl">
              {dict.landing.heroSubtitle}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={ctaHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 rounded-full px-6 text-base shadow-lg shadow-primary/20",
                )}
              >
                {ctaLabel}
                <ArrowRight className="ml-1 size-4" aria-hidden />
              </Link>
              {!user ? (
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-12 rounded-full border-border/80 bg-background/70 px-5 text-base backdrop-blur",
                  )}
                >
                  {dict.landing.heroCtaSecondary}
                </Link>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs text-muted-foreground">
              <span className="font-medium">{dict.landing.trustStrip}</span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" aria-hidden />
                {dict.landing.trust.ai}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Database className="size-3.5 text-primary" aria-hidden />
                {dict.landing.trust.db}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <LayoutGrid className="size-3.5 text-primary" aria-hidden />
                {dict.landing.trust.fw}
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-primary/10 blur-3xl" />
            <HeroMockup className="md:rotate-[0.5deg]" />
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl space-y-20 px-4 md:px-8 md:space-y-28">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">
              {dict.landing.featuresEyebrow}
            </p>
            <h2 className="mt-3 font-heading text-3xl tracking-tight text-balance md:text-5xl">
              {dict.landing.featuresTitle}
            </h2>
          </div>

          <FeatureRow
            icon={Sparkles}
            badge={dict.landing.features.ai.badge}
            title={dict.landing.features.ai.title}
            body={dict.landing.features.ai.body}
            visual={<AIFeatureVisual />}
          />
          <FeatureRow
            icon={LayoutGrid}
            badge={dict.landing.features.dashboard.badge}
            title={dict.landing.features.dashboard.title}
            body={dict.landing.features.dashboard.body}
            reverse
            visual={<DashboardFeatureVisual />}
          />
          <FeatureRow
            icon={Users}
            badge={dict.landing.features.social.badge}
            title={dict.landing.features.social.title}
            body={dict.landing.features.social.body}
            visual={<SocialFeatureVisual />}
          />
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/30 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">
              {dict.landing.how.eyebrow}
            </p>
            <h2 className="mt-3 font-heading text-3xl tracking-tight text-balance md:text-5xl">
              {dict.landing.how.title}
            </h2>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              dict.landing.how.step1,
              dict.landing.how.step2,
              dict.landing.how.step3,
            ].map((step, index) => (
              <li
                key={step.title}
                className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 font-heading text-lg text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-heading text-xl tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground text-pretty">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border/60 py-20 md:py-28">
        <div className="bg-emerald-band absolute inset-x-4 inset-y-4 -z-10 rounded-[2.5rem]" />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 text-center md:px-8">
          <h2 className="max-w-3xl font-heading text-3xl tracking-tight text-balance text-primary-foreground md:text-5xl">
            {dict.landing.cta.title}
          </h2>
          <p className="max-w-xl text-lg text-primary-foreground/85 text-pretty">
            {dict.landing.cta.body}
          </p>
          <Link
            href={ctaHref}
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 rounded-full bg-background px-6 text-base text-foreground hover:bg-background/90",
            )}
          >
            {dict.landing.cta.button}
            <ArrowRight className="ml-1 size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <Logo />
          <p>{dict.landing.footer.madeWith}</p>
          <p>{legal}</p>
        </div>
      </footer>
    </main>
  );
}
