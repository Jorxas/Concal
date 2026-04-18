"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(app)/actions";
import {
  Compass,
  LayoutDashboard,
  PlusCircle,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const NAV = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/meals/explore", label: "Découvrir", icon: Compass },
  { href: "/meals/new", label: "Nouveau repas", icon: PlusCircle },
  { href: "/profile", label: "Profil", icon: UserRound },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavLinkProps = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
  compact?: boolean;
};

function NavLink({ href, label, icon: Icon, pathname, compact }: NavLinkProps) {
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({
          variant: active ? "secondary" : "ghost",
          size: compact ? "sm" : "default",
        }),
        compact
          ? "h-11 flex-1 flex-col gap-0.5 px-1 py-1 text-[10px] font-medium"
          : "w-full justify-start gap-2",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={cn("shrink-0", compact ? "size-5" : "size-4")} aria-hidden />
      <span className={compact ? "leading-tight" : ""}>{label}</span>
    </Link>
  );
}

/**
 * Barre latérale (desktop) + navigation bas d’écran (mobile).
 */
export function AppNavigation() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden min-h-0 w-52 shrink-0 flex-col border-r border-border bg-card/40 md:flex md:py-4">
        <div className="px-3 pb-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold tracking-tight hover:bg-muted"
          >
            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-primary">
              Concal
            </span>
          </Link>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 px-2" aria-label="Navigation principale">
          {NAV.map((item) => (
            <NavLink key={item.href} pathname={pathname} {...item} />
          ))}
        </nav>
        <form action={signOut} className="mt-auto border-t border-border px-2 pt-3 pb-2">
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full text-muted-foreground",
            )}
          >
            Déconnexion
          </button>
        </form>
      </aside>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 px-1 py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
        aria-label="Navigation principale"
      >
        {NAV.map((item) => (
          <NavLink key={item.href} pathname={pathname} {...item} compact />
        ))}
      </nav>
    </>
  );
}
