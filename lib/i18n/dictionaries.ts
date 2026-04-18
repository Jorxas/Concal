import "server-only";
import type { Locale } from "./config";

export type Dictionary = typeof import("../../messages/en.json");

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("../../messages/en.json").then((m) => m.default),
  fr: () => import("../../messages/fr.json").then((m) => m.default),
  de: () => import("../../messages/de.json").then((m) => m.default),
};

/** Server-only: load the full dictionary for a locale. */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const loader = loaders[locale] ?? loaders.fr;
  return loader();
}
