import { safeQuery } from '@/lib/db/safe-query';
import { getAllSyncStates } from '@/lib/db/queries/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EtlTriggerButton } from './etl-trigger-button';

export const dynamic = 'force-dynamic';

export default async function AdminEtlPage() {
  const syncStates = await safeQuery(() => getAllSyncStates());

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ETL Status</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor and manage ETL sync processes across all cities.
          </p>
        </div>
        <EtlTriggerButton />
      </div>

      {!syncStates || syncStates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-sm text-muted-foreground">
              No ETL sync states found. Run the ETL trigger to initialize sync states.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {syncStates.map((state) => (
            <Card key={state.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {state.cityName ?? `City ${state.cityId}`}
                  </CardTitle>
                  <SyncStatusBadge status={state.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <InfoBlock
                    label="Last Sync"
                    value={
                      state.lastSyncAt
                        ? formatRelativeTime(new Date(state.lastSyncAt))
                        : 'Never'
                    }
                  />
                  <InfoBlock
                    label="Records Synced"
                    value={(state.recordsSynced ?? 0).toLocaleString()}
                  />
                  <InfoBlock
                    label="Last Record ID"
                    value={state.lastRecordId ?? '-'}
                  />
                  <InfoBlock
                    label="Last Offset"
                    value={(state.lastOffset ?? 0).toLocaleString()}
                  />
                </div>

                {state.errorMessage && (
                  <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                    <p className="text-xs font-medium text-destructive">Error</p>
                    <p className="mt-1 text-sm text-destructive/80">
                      {state.errorMessage}
                    </p>
                  </div>
                )}

                {state.updatedAt && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Last updated: {new Date(state.updatedAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
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

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
