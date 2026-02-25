import { Skeleton } from '@/components/ui/skeleton';

export default function PermitDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-96" />

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Skeleton className="h-9 w-64" />
              <Skeleton className="mt-2 h-5 w-48" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* Map */}
          <Skeleton className="mt-6 h-48 w-full rounded-xl" />

          {/* Narrative */}
          <Skeleton className="mt-8 h-7 w-56" />
          <div className="mt-4 space-y-3 rounded-xl border border-border bg-card p-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Details */}
          <Skeleton className="mt-8 h-7 w-48" />
          <div className="mt-4 space-y-4 rounded-xl border border-border bg-card p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
