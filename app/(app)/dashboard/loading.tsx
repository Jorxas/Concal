export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-8 md:px-8 md:py-10">
      <div className="space-y-3">
        <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
        <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-56 animate-pulse rounded-3xl border border-border/60 bg-muted/40" />
      <div className="h-64 animate-pulse rounded-3xl border border-border/60 bg-muted/40" />
    </div>
  );
}
