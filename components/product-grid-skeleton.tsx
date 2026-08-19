export function ProductGridSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-[20px] bg-charcoal p-3">
          <div className="aspect-square w-full animate-pulse rounded-[12px] bg-mat" />
          <div className="h-3 w-16 animate-pulse rounded bg-mat" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-mat" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-mat" />
          <div className="h-10 w-full animate-pulse rounded-[10px] bg-mat" />
        </div>
      ))}
    </div>
  );
}
