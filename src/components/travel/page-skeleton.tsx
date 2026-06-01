type PageSkeletonProps = {
  cards?: number;
  showHeader?: boolean;
};

// Shared loading placeholder so route transitions feel instant while the
// server component streams in. Mirrors the typical PageHeader + card grid.
export function PageSkeleton({ cards = 6, showHeader = true }: PageSkeletonProps) {
  return (
    <div className="h-full w-full overflow-hidden bg-background p-6 md:p-8" aria-hidden="true">
      <div className="animate-pulse">
        {showHeader ? (
          <div className="mb-8 flex flex-col gap-3">
            <div className="h-5 w-28 rounded-full bg-surface-2" />
            <div className="h-10 w-2/3 max-w-xl rounded-xl bg-surface-2 md:h-14" />
            <div className="h-4 w-full max-w-2xl rounded-lg bg-surface-2" />
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="h-32 w-full rounded-xl bg-surface-2" />
              <div className="mt-4 h-4 w-3/4 rounded-lg bg-surface-2" />
              <div className="mt-3 h-3 w-full rounded-lg bg-surface-2" />
              <div className="mt-2 h-3 w-5/6 rounded-lg bg-surface-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
