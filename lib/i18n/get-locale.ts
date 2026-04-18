import "server-only";
import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  isLocale,
  type Locale,
} from "./config";

function matchLocaleFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const candidates = header
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);
  for (const raw of candidates) {
    if (!raw) continue;
    const short = raw.slice(0, 2);
    if ((LOCALES as readonly string[]).includes(short)) {
      return short as Locale;
    }
  }
  return null;
}

/**
 * Resolve the active locale from (in order): explicit cookie, Accept-Language
 * header, then the default locale. Returns a typed locale string.
 */
export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const cookieValue = jar.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieValue)) return cookieValue;

  const hdrs = await headers();
  const fromAccept = matchLocaleFromAcceptLanguage(
    hdrs.get("accept-language"),
  );
  if (fromAccept) return fromAccept;

  return DEFAULT_LOCALE;
}
