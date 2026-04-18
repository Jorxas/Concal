import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/marketing/logo";
import { cn } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { dict } = await getI18n();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <Logo />
      <p className="font-heading text-7xl tracking-tight text-primary/40">404</p>
      <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
        {dict.errors.notFoundTitle}
      </h1>
      <p className="max-w-md text-muted-foreground">{dict.errors.notFoundBody}</p>
      <Link
        href="/"
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-11 rounded-full px-5 text-sm",
        )}
      >
        {dict.errors.goHome}
      </Link>
    </main>
  );
}
