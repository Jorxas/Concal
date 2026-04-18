/**
 * Mise en page des pages d’authentification (centrage, mobile-first).
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-background p-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
