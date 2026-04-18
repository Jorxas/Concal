import { AppShell } from "@/components/layout/app-shell";

/**
 * Coque des pages authentifiées : barre latérale + navigation mobile.
 */
export default function AppRouteGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
