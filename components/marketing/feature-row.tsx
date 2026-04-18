import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type FeatureRowProps = {
  icon: LucideIcon;
  badge?: string;
  title: string;
  body: string;
  reverse?: boolean;
  visual: React.ReactNode;
};

export function FeatureRow({
  icon: Icon,
  badge,
  title,
  body,
  reverse,
  visual,
}: FeatureRowProps) {
  return (
    <div
      className={cn(
        "grid items-center gap-10 md:grid-cols-2 md:gap-14",
        reverse && "md:[&>*:first-child]:order-2",
      )}
    >
      <div className="space-y-5">
        {badge ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Icon className="size-3.5" aria-hidden />
            {badge}
          </span>
        ) : null}
        <h3 className="font-heading text-3xl tracking-tight text-balance md:text-4xl">
          {title}
        </h3>
        <p className="max-w-md text-lg text-muted-foreground text-pretty">
          {body}
        </p>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-emerald-soft/60 blur-2xl" />
        {visual}
      </div>
    </div>
  );
}
