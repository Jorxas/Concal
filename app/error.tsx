"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="font-heading text-7xl tracking-tight text-destructive/40">
        500
      </p>
      <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
        Something went wrong
      </h1>
      <p className="max-w-md text-muted-foreground">
        Please try again. If the issue persists, contact support.
      </p>
      <Button
        onClick={() => reset()}
        className="h-11 rounded-full px-5 text-sm"
      >
        Try again
      </Button>
    </main>
  );
}
