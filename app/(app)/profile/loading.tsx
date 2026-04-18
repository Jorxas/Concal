export default function ProfileLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-4 py-8 md:px-8 md:py-10">
      <div className="h-28 animate-pulse rounded-3xl border border-border/60 bg-muted/40" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-border/60 bg-muted/40"
          />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-border/60 bg-muted/40"
          />
        ))}
      </div>
    </div>
  );
}
