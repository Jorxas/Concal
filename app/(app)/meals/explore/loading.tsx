export default function ExploreLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-8 md:px-8 md:py-10">
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
      </div>
      <ul className="grid list-none grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="overflow-hidden rounded-3xl border border-border/60 bg-card"
          >
            <div className="aspect-[5/4] w-full animate-pulse bg-muted" />
            <div className="space-y-3 p-4">
              <div className="flex gap-2">
                <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
