import { Badge } from '@/components/ui/badge';
import { PERMIT_CATEGORIES, PERMIT_STATUSES } from '@/lib/config/constants';
import { formatDate, formatCurrency } from '@/lib/utils/format';

interface PermitDetailTableProps {
  permit: {
    globalPermitId: string;
    propertyAddress: string;
    permitCategory: string;
    permitType: string | null;
    status: string;
    issueDate: string | null;
    applicationDate: string | null;
    estimatedCost: string | null;
    workDescription: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

export function PermitDetailTable({ permit }: PermitDetailTableProps) {
  const rows = [
    { label: 'Permit ID', value: permit.globalPermitId },
    {
      label: 'Category',
      value: PERMIT_CATEGORIES[permit.permitCategory] || permit.permitCategory,
    },
    { label: 'Type', value: permit.permitType },
    { label: 'Status', value: PERMIT_STATUSES[permit.status] || permit.status },
    {
      label: 'Issue Date',
      value: permit.issueDate ? formatDate(permit.issueDate) : null,
    },
    {
      label: 'Application Date',
      value: permit.applicationDate ? formatDate(permit.applicationDate) : null,
    },
    {
      label: 'Estimated Cost',
      value: permit.estimatedCost
        ? formatCurrency(parseFloat(permit.estimatedCost))
        : null,
    },
    { label: 'Address', value: permit.propertyAddress },
    { label: 'Work Description', value: permit.workDescription },
    {
      label: 'Coordinates',
      value:
        permit.latitude && permit.longitude
          ? `${permit.latitude.toFixed(6)}, ${permit.longitude.toFixed(6)}`
          : null,
    },
  ].filter((row) => row.value);

  return (
    <div className="rounded-xl border border-border bg-card">
      <dl className="divide-y divide-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-1 px-6 py-3 sm:flex-row sm:justify-between sm:gap-4"
          >
            <dt className="text-sm font-medium text-muted-foreground">{row.label}</dt>
            <dd className="max-w-md text-sm text-foreground sm:text-right">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
