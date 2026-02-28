import { safeQuery } from '@/lib/db/safe-query';
import { getAllContractors, getContractorStats } from '@/lib/db/queries/contractors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-500 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  suspended: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default async function AdminContractorsPage() {
  const [contractors, stats] = await Promise.all([
    safeQuery(() => getAllContractors({ limit: 100 })),
    safeQuery(() => getContractorStats()),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Contractors</h1>
        <p className="mt-1 text-muted-foreground">
          Manage contractor accounts and approvals
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Contractors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{stats?.active ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">{stats?.pending ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Contractors</CardTitle>
        </CardHeader>
        <CardContent>
          {!contractors || contractors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No contractors registered yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Company</th>
                    <th className="pb-3 font-medium">Contact</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Billing</th>
                    <th className="pb-3 font-medium">Joined</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {contractors.map((contractor) => (
                    <tr key={contractor.id} className="text-sm">
                      <td className="py-4">
                        <div className="font-medium">{contractor.companyName}</div>
                        <div className="text-xs text-muted-foreground">
                          {contractor.slug}
                        </div>
                      </td>
                      <td className="py-4">{contractor.contactName}</td>
                      <td className="py-4">
                        <a
                          href={`mailto:${contractor.email}`}
                          className="text-primary hover:underline"
                        >
                          {contractor.email}
                        </a>
                      </td>
                      <td className="py-4">
                        <Badge
                          className={statusColors[contractor.status ?? 'pending'] || statusColors.pending}
                        >
                          {contractor.status}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <span className="text-xs">
                          {contractor.stripeCustomerId ? (
                            <span className="text-green-500">Payment on file</span>
                          ) : (
                            <span className="text-muted-foreground">No payment</span>
                          )}
                        </span>
                      </td>
                      <td className="py-4 text-muted-foreground">
                        {contractor.createdAt
                          ? new Date(contractor.createdAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="py-4">
                        <Link
                          href={`/admin/contractors/${contractor.id}`}
                          className="text-primary hover:underline"
                        >
                          View
                        </Link>
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
