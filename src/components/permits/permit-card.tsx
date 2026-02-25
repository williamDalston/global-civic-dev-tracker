import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { PERMIT_CATEGORIES, PERMIT_STATUSES } from '@/lib/config/constants';

interface PermitCardProps {
  permit: {
    id?: number;
    globalPermitId?: string;
    slug: string;
    propertyAddress: string;
    permitCategory: string;
    permitType: string | null;
    status: string;
    issueDate: string | null;
    estimatedCost: string | number | null;
    workDescription: string | null;
  };
  href: string;
  compact?: boolean;
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'approved':
      return 'success' as const;
    case 'pending':
      return 'warning' as const;
    case 'revoked':
    case 'expired':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
}

export function PermitCard({ permit, href, compact }: PermitCardProps) {
  const cost =
    typeof permit.estimatedCost === 'number'
      ? permit.estimatedCost
      : permit.estimatedCost
        ? parseFloat(permit.estimatedCost)
        : null;

  if (compact) {
    return (
      <Link href={href} className="group block">
        <div className="rounded-lg border border-border bg-card p-3 transition-all duration-200 hover:border-primary/50 hover:bg-primary/[0.02]">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              {PERMIT_CATEGORIES[permit.permitCategory] || permit.permitCategory}
            </p>
            <Badge variant={getStatusVariant(permit.status)} className="shrink-0 text-xs">
              {PERMIT_STATUSES[permit.status] || permit.status}
            </Badge>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{permit.propertyAddress}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="group block">
      <Card className="card-hover-lift h-full hover:border-primary/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {cost !== null && !isNaN(cost) && (
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {formatCurrency(cost)}
                </p>
              )}
              <p className="mt-1 text-sm font-medium text-foreground">
                {PERMIT_CATEGORIES[permit.permitCategory] || permit.permitCategory}
              </p>
            </div>
            <Badge variant={getStatusVariant(permit.status)}>
              {PERMIT_STATUSES[permit.status] || permit.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-muted-foreground">{permit.propertyAddress}</p>
          {permit.workDescription && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {permit.workDescription}
            </p>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {permit.permitType && <span>{permit.permitType}</span>}
              {permit.issueDate && <span>{formatDate(permit.issueDate)}</span>}
            </div>
            <span className="font-medium text-primary opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100">
              View &rarr;
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
