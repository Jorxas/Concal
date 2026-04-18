import "server-only";
import { getDictionary, type Dictionary } from "./dictionaries";
import { getLocale } from "./get-locale";
import type { Locale } from "./config";

export type { Dictionary, Locale };

/** Convenience for server components: returns the active locale and dictionary. */
export async function getI18n(): Promise<{
  locale: Locale;
  dict: Dictionary;
}> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return { locale, dict };
}
