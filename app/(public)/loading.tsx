import { ProductGridSkeleton } from "@/components/product-grid-skeleton";

export default function Loading() {
  return (
    <div>
      <div className="h-8 w-40 animate-pulse rounded-md bg-charcoal" />
      <div className="mt-2 h-4 w-64 animate-pulse rounded-md bg-charcoal" />

      <div className="mt-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 shrink-0 animate-pulse rounded-full bg-charcoal" />
        ))}
      </div>

      <ProductGridSkeleton />
    </div>
  );
}
