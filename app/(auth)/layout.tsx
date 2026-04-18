import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { Logo } from "@/components/marketing/logo";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { dict, locale } = await getI18n();

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between px-4 py-4 md:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            <Logo />
          </Link>
          <LocaleSwitcher current={locale} variant="compact" />
        </header>
        <div className="flex flex-1 items-center justify-center px-4 pb-16 md:px-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

      <aside className="relative hidden w-full max-w-xl overflow-hidden lg:block">
        <div className="bg-emerald-band absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute top-20 left-10 size-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute right-0 bottom-0 size-80 rounded-full bg-white/15 blur-3xl" />
        </div>
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <Logo
            label={dict.common.brand}
            className="text-primary-foreground"
            markClassName="bg-white/15 text-primary-foreground"
          />
          <div className="space-y-8">
            <blockquote className="font-heading text-3xl leading-snug italic text-balance xl:text-4xl">
              {dict.auth.panel.quote}
            </blockquote>
            <p className="text-sm text-primary-foreground/80">
              {dict.auth.panel.quoteAuthor}
            </p>
          </div>
          <ul className="space-y-3 text-sm text-primary-foreground/90">
            {[
              dict.auth.panel.bullet1,
              dict.auth.panel.bullet2,
              dict.auth.panel.bullet3,
            ].map((bullet) => (
              <li key={bullet} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
                  <Check className="size-3" aria-hidden />
                </span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
