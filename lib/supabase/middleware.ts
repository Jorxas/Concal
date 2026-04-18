import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

type UpdateSessionOptions = {
  /**
   * When this returns true and there is no authenticated user, the user is
   * redirected to `/` with a `next` query param (swap for `/login` when auth UI exists).
   */
  isProtectedPath?: (pathname: string) => boolean;
};

/**
 * Refreshes the Supabase auth session for this request and applies updated cookies
 * to the returned `NextResponse`. Optionally blocks unauthenticated access to
 * protected routes.
 */
export async function updateSession(
  request: NextRequest,
  options?: UpdateSessionOptions,
) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(
      "[concal] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
    if (options?.isProtectedPath?.(request.nextUrl.pathname)) {
      const fallback = request.nextUrl.clone();
      fallback.pathname = "/";
      return NextResponse.redirect(fallback);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
          supabaseResponse.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const needsAuth = options?.isProtectedPath?.(request.nextUrl.pathname);
  if (needsAuth && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    const redirectResponse = NextResponse.redirect(redirectUrl);

    // Preserve refreshed session cookies on the redirect response.
    const setCookies = supabaseResponse.headers.getSetCookie();
    setCookies.forEach((cookie) => {
      redirectResponse.headers.append("set-cookie", cookie);
    });

    return redirectResponse;
  }

  return supabaseResponse;
}
