import { PermitCard } from './permit-card';

interface PermitListProps {
  permits: Array<{
    id: number;
    slug: string;
    propertyAddress: string;
    permitCategory: string;
    permitType: string | null;
    status: string;
    issueDate: string | null;
    estimatedCost: string | null;
    workDescription: string | null;
  }>;
  basePath: string;
}

export function PermitList({ permits, basePath }: PermitListProps) {
  if (permits.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">No permits found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Check back later for new development activity.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {permits.map((permit) => (
        <PermitCard key={permit.id} permit={permit} href={`${basePath}/${permit.slug}`} />
      ))}
    </div>
  );
}
