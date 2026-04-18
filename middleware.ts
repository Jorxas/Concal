import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * URL prefixes for the `app/(app)` route group (parentheses do not appear in URLs).
 * Update when you add new authenticated areas.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/log",
  "/meals",
  "/profile",
] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  return updateSession(request, { isProtectedPath });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
