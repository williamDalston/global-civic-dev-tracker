import { Skeleton } from '@/components/ui/skeleton';

export default function NeighborhoodLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-80" />

      {/* Title */}
      <Skeleton className="mt-6 h-10 w-96" />
      <Skeleton className="mt-2 h-5 w-72" />

      {/* Map placeholder */}
      <Skeleton className="mt-6 h-64 w-full rounded-xl" />

      {/* Permit grid */}
      <Skeleton className="mt-8 h-8 w-48" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex justify-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-10 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
