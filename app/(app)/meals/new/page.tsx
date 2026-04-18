import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { MealUploadForm } from "@/components/meals/meal-upload-form";
import { cn } from "@/lib/utils";

export default function NewMealPage() {
  return (
    <div className="mx-auto w-full max-w-xl flex-1 space-y-6 px-4 py-8">
      <div>
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 gap-1 px-2 text-muted-foreground",
          )}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Tableau de bord
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
          Nouveau repas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Les données seront enregistrées pour aujourd’hui dans ton journal.
        </p>
      </div>
      <MealUploadForm />
    </div>
  );
}
