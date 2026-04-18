import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSafeReturnPath } from "@/lib/auth/return-path";

const EMAIL_OTP_TYPES = new Set([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function loginWithAuthError(request: NextRequest) {
  const u = new URL("/login", request.url);
  u.searchParams.set("error", "auth_callback");
  return NextResponse.redirect(u);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = getSafeReturnPath(requestUrl.searchParams.get("next"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return loginWithAuthError(request);
  }

  const supabaseResponse = NextResponse.redirect(new URL(next, request.url));

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return loginWithAuthError(request);
    }
    return supabaseResponse;
  }

  if (tokenHash && type && EMAIL_OTP_TYPES.has(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as
        | "signup"
        | "invite"
        | "magiclink"
        | "recovery"
        | "email_change"
        | "email",
    });
    if (error) {
      return loginWithAuthError(request);
    }
    return supabaseResponse;
  }

  return loginWithAuthError(request);
}
