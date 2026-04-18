"use client";

import * as React from "react";
import { useTransition } from "react";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setLocale } from "@/app/actions/locale";
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_SHORT,
  type Locale,
} from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type LocaleSwitcherProps = {
  current: Locale;
  variant?: "compact" | "default";
  className?: string;
};

export function LocaleSwitcher({
  current,
  variant = "default",
  className,
}: LocaleSwitcherProps) {
  const [pending, startTransition] = useTransition();

  function handleChange(next: string | null) {
    if (!next || next === current) return;
    startTransition(async () => {
      await setLocale(next);
    });
  }

  return (
    <Select value={current} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger
        aria-label="Language"
        className={cn(
          "h-9 gap-1.5 rounded-full border-border/70 bg-background/60 px-3 text-sm font-medium hover:bg-muted",
          variant === "compact" && "h-8 px-2.5 text-xs",
          className,
        )}
      >
        <Globe className="size-4 text-muted-foreground" aria-hidden />
        <SelectValue>
          {variant === "compact"
            ? LOCALE_SHORT[current]
            : LOCALE_LABELS[current]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        {LOCALES.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <span className="font-medium">{LOCALE_SHORT[loc]}</span>
            <span className="text-muted-foreground">{LOCALE_LABELS[loc]}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
