import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { MealUploadForm } from "@/components/meals/meal-upload-form";
import { cn } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";

export default async function NewMealPage() {
  const { dict } = await getI18n();
  const formDict = { ...dict.meals.new, cancel: dict.common.cancel };

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-8 md:px-8 md:py-10">
      <div>
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 gap-1 px-2 text-muted-foreground",
          )}
        >
          <ChevronLeft className="size-4" aria-hidden />
          {dict.nav.dashboard}
        </Link>
        <h1 className="mt-3 font-heading text-3xl tracking-tight md:text-4xl">
          {dict.meals.new.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dict.meals.new.subtitle}
        </p>
      </div>
      <MealUploadForm dict={formDict} />
    </div>
  );
}
