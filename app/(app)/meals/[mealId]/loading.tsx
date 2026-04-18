export default function MealDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 md:px-6 md:py-10">
      <div className="h-8 w-32 animate-pulse rounded bg-muted" />
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
        <div className="aspect-[3/2] w-full animate-pulse bg-muted" />
        <div className="space-y-4 p-6 md:p-8">
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-20 animate-pulse rounded-2xl bg-muted/70" />
        </div>
      </div>
    </div>
  );
}
