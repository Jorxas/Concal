import { AppNavigation } from "@/components/layout/app-navigation";
import { createClient } from "@/lib/supabase/server";
import { getI18n } from "@/lib/i18n/server";

/**
 * Authenticated shell: sidebar (desktop), bottom nav (mobile), scrollable content.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const { dict, locale } = await getI18n();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const navDict = { ...dict.nav, signOut: dict.common.signOut };

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <AppNavigation dict={navDict} locale={locale} email={user?.email ?? null} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-24 md:pb-0">
        {children}
      </div>
    </div>
  );
}
