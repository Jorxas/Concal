import { AppNavigation } from "@/components/layout/app-navigation";

/**
 * Mise en page des routes authentifiées : navigation + contenu défilable.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <AppNavigation />
      <div className="min-h-0 flex-1 overflow-y-auto pb-20 md:pb-0">{children}</div>
    </div>
  );
}
