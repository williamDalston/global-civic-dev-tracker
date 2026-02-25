import { safeQuery } from '@/lib/db/safe-query';
import { getLeadStats, getAllSyncStates, getTotalPermitsCount } from '@/lib/db/queries/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [leadStats, syncStates, permitsCount] = await Promise.all([
    safeQuery(() => getLeadStats()),
    safeQuery(() => getAllSyncStates()),
    safeQuery(() => getTotalPermitsCount()),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of leads, ETL status, and permit data.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={leadStats?.total ?? 0}
          description="All time"
        />
        <StatCard
          title="New Leads"
          value={leadStats?.new ?? 0}
          description="Awaiting contact"
          variant="warning"
        />
        <StatCard
          title="Contacted"
          value={leadStats?.contacted ?? 0}
          description="In progress"
          variant="default"
        />
        <StatCard
          title="Converted"
          value={leadStats?.converted ?? 0}
          description="Successfully converted"
          variant="success"
        />
      </div>

      {/* Permits Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Permits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-foreground">
              {(permitsCount ?? 0).toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">total permits tracked</span>
          </div>
        </CardContent>
      </Card>

      {/* ETL Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle>ETL Sync Status</CardTitle>
        </CardHeader>
        <CardContent>
          {!syncStates || syncStates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sync states found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">City</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Last Sync</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Records</th>
                    <th className="pb-3 font-medium text-muted-foreground">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {syncStates.map((state) => (
                    <tr key={state.id}>
                      <td className="py-3 pr-4 font-medium text-foreground">
                        {state.cityName ?? `City ${state.cityId}`}
                      </td>
                      <td className="py-3 pr-4">
                        <SyncStatusBadge status={state.status} />
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {state.lastSyncAt
                          ? new Date(state.lastSyncAt).toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="py-3 pr-4 text-foreground">
                        {(state.recordsSynced ?? 0).toLocaleString()}
                      </td>
                      <td className="max-w-xs truncate py-3 text-destructive">
                        {state.errorMessage || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  variant,
}: {
  title: string;
  value: number;
  description: string;
  variant?: 'default' | 'success' | 'warning';
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">{value.toLocaleString()}</span>
          {variant && (
            <Badge variant={variant} className="text-xs">
              {description}
            </Badge>
          )}
          {!variant && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SyncStatusBadge({ status }: { status: string | null }) {
  const s = status ?? 'unknown';
  const variant =
    s === 'idle'
      ? 'secondary'
      : s === 'running'
        ? 'warning'
        : s === 'completed'
          ? 'success'
          : s === 'error'
            ? 'destructive'
            : 'outline';

  return <Badge variant={variant as 'default'}>{s}</Badge>;
}
