// Pulse-animated placeholders shaped like the real content, shown while
// TMDb requests are in flight instead of a blank screen + spinner.

export function SkeletonCard() {
  return (
    <div className="w-[160px] flex-shrink-0 sm:w-[180px]">
      <div className="aspect-[2/3] animate-pulse rounded-lg bg-base-800" />
    </div>
  );
}

export function SkeletonRow({ count = 6 }) {
  return (
    <div className="mb-8 px-4 sm:px-8">
      <div className="mb-3 h-6 w-40 animate-pulse rounded bg-base-800" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }) {
  return (
    <div className="flex flex-wrap gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="h-[62vh] min-h-[420px] w-full animate-pulse bg-base-850 sm:h-[78vh]" />
  );
}
