"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  LayoutDashboard,
  PlusCircle,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/marketing/logo";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { UserChip } from "@/components/layout/user-chip";
import type { Locale } from "@/lib/i18n/config";

export type NavDict = {
  dashboard: string;
  explore: string;
  newMeal: string;
  profile: string;
  primary: string;
  signOut: string;
};

type NavItem = {
  key: "dashboard" | "explore" | "newMeal" | "profile";
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: readonly NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "explore", href: "/meals/explore", icon: Compass },
  { key: "newMeal", href: "/meals/new", icon: PlusCircle },
  { key: "profile", href: "/profile", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AppNavigationProps = {
  dict: NavDict;
  locale: Locale;
  email: string | null;
};

export function AppNavigation({ dict, locale, email }: AppNavigationProps) {
  const pathname = usePathname();

  return (
    <>
      <aside
        className="hidden min-h-0 w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar px-4 py-6 md:flex"
        aria-label={dict.primary}
      >
        <Link href="/dashboard" className="px-1 pb-6">
          <Logo />
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity",
                    active && "opacity-100",
                  )}
                />
                <Icon className="size-4 shrink-0" aria-hidden />
                {dict[item.key]}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 space-y-2">
          <LocaleSwitcher current={locale} className="w-full justify-between" />
          <UserChip email={email} signOutLabel={dict.signOut} />
        </div>
      </aside>

      <nav
        aria-label={dict.primary}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:hidden"
      >
        <div className="flex items-stretch justify-around gap-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="leading-tight">{dict[item.key]}</span>
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute -top-0.5 size-1.5 rounded-full bg-primary transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
