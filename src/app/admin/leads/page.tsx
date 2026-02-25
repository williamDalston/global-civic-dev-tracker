import Link from 'next/link';
import { safeQuery } from '@/lib/db/safe-query';
import { getLeadsPaginated, getAllCities } from '@/lib/db/queries/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LeadStatusSelect } from './lead-status-select';

export const dynamic = 'force-dynamic';

interface LeadsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    cityId?: string;
  }>;
}

export default async function AdminLeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const statusFilter = params.status || undefined;
  const cityIdFilter = params.cityId ? parseInt(params.cityId, 10) : undefined;

  const [result, cities] = await Promise.all([
    safeQuery(() => getLeadsPaginated(page, 25, { status: statusFilter, cityId: cityIdFilter })),
    safeQuery(() => getAllCities()),
  ]);

  const leads = result?.items ?? [];
  const totalPages = result?.totalPages ?? 1;
  const total = result?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total.toLocaleString()} total lead{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Filter:</span>

            {/* Status filter */}
            <div className="flex gap-1">
              {['all', 'new', 'contacted', 'converted', 'archived'].map((s) => {
                const isActive = s === 'all' ? !statusFilter : statusFilter === s;
                const href =
                  s === 'all'
                    ? buildUrl({ cityId: params.cityId })
                    : buildUrl({ status: s, cityId: params.cityId });

                return (
                  <Link
                    key={s}
                    href={href}
                    className={
                      isActive
                        ? 'rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground'
                        : 'rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
                    }
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Link>
                );
              })}
            </div>

            {/* City filter */}
            {cities && cities.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">City:</span>
                <div className="flex gap-1">
                  <Link
                    href={buildUrl({ status: params.status })}
                    className={
                      !cityIdFilter
                        ? 'rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground'
                        : 'rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
                    }
                  >
                    All
                  </Link>
                  {cities.map((city) => (
                    <Link
                      key={city.id}
                      href={buildUrl({
                        status: params.status,
                        cityId: String(city.id),
                      })}
                      className={
                        cityIdFilter === city.id
                          ? 'rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground'
                          : 'rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
                      }
                    >
                      {city.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lead Records
            {totalPages > 1 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                Page {page} of {totalPages}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No leads found matching the current filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Name</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Email</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">City</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Work Type</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Source</th>
                    <th className="pb-3 font-medium text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="group">
                      <td className="py-3 pr-4 font-medium text-foreground">{lead.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{lead.email}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {lead.cityName ?? '-'}
                      </td>
                      <td className="py-3 pr-4">
                        {lead.workType ? (
                          <Badge variant="outline" className="text-xs">
                            {lead.workType}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <LeadStatusSelect
                          leadId={lead.id}
                          currentStatus={lead.status ?? 'new'}
                        />
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {lead.utmSource ?? '-'}
                      </td>
                      <td className="py-3 whitespace-nowrap text-muted-foreground">
                        {lead.createdAt
                          ? new Date(lead.createdAt).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 25 + 1}-{Math.min(page * 25, total)} of{' '}
                {total.toLocaleString()}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={buildUrl({
                      page: String(page - 1),
                      status: params.status,
                      cityId: params.cityId,
                    })}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={buildUrl({
                      page: String(page + 1),
                      status: params.status,
                      cityId: params.cityId,
                    })}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function buildUrl(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return `/admin/leads${qs ? `?${qs}` : ''}`;
}
