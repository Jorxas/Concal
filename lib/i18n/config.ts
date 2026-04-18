export const LOCALES = ["en", "fr", "de"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
};

export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
  de: "DE",
};

export function isLocale(value: string | undefined | null): value is Locale {
  if (!value) return false;
  return (LOCALES as readonly string[]).includes(value);
}
