import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Providers } from "@/components/providers";
import { getLocale } from "@/lib/i18n/get-locale";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const serifDisplay = Instrument_Serif({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Concal — AI-powered calorie tracking & recipe sharing",
    template: "%s · Concal",
  },
  description:
    "Track your calories with AI-powered photo analysis and share recipes with a vibrant community.",
  applicationName: "Concal",
  keywords: [
    "calories",
    "nutrition",
    "AI",
    "recipes",
    "Gemini",
    "Supabase",
    "Next.js",
  ],
  openGraph: {
    title: "Concal — AI-powered calorie tracking",
    description:
      "Snap a photo, let AI estimate calories and macros, share recipes with friends.",
    type: "website",
    siteName: "Concal",
  },
  twitter: {
    card: "summary_large_image",
    title: "Concal",
    description:
      "AI-powered calorie tracking and social recipe sharing.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${serifDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
