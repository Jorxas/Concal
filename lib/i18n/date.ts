import { enUS, fr, de, type Locale as DateLocale } from "date-fns/locale";
import type { Locale } from "@/lib/i18n/config";

const MAP: Record<Locale, DateLocale> = {
  en: enUS,
  fr,
  de,
};

export function dateLocaleFor(locale: Locale): DateLocale {
  return MAP[locale] ?? enUS;
}
