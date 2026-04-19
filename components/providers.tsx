"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

/**
 * Fournisseurs globaux : thème fixe clair (Sonner + pas de classe `.dark`) et toasts.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      forcedTheme="light"
    >
      {children}
      <Toaster richColors position="top-center" closeButton />
    </ThemeProvider>
  );
}
