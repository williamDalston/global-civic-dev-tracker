import { notFound } from 'next/navigation';
import { safeQuery } from '@/lib/db/safe-query';
import {
  getContractorById,
  getContractorServiceAreas,
  getContractorCategories,
  getContractorLeadAssignments,
  getContractorBillingHistory,
} from '@/lib/db/queries/contractors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PERMIT_CATEGORIES } from '@/lib/config/constants';
import { ContractorStatusForm } from './status-form';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-500 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  suspended: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default async function AdminContractorDetailPage({ params }: Props) {
  const { id } = await params;
  const contractorId = parseInt(id, 10);

  if (isNaN(contractorId)) {
    notFound();
  }

  const contractor = await safeQuery(() => getContractorById(contractorId));

  if (!contractor) {
    notFound();
  }

  const [serviceAreas, categories, leadAssignments, billingHistory] = await Promise.all([
    safeQuery(() => getContractorServiceAreas(contractorId)),
    safeQuery(() => getContractorCategories(contractorId)),
    safeQuery(() => getContractorLeadAssignments(contractorId, { limit: 10 })),
    safeQuery(() => getContractorBillingHistory(contractorId, { limit: 10 })),
  ]);

  const categoryLabels = (categories ?? []).map(
    (c) => PERMIT_CATEGORIES[c.category] || c.category
  );

  const cities = [...new Set((serviceAreas ?? []).map((a) => a.cityName).filter(Boolean))];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/contractors"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Contractors
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{contractor.companyName}</h1>
          <p className="mt-1 text-muted-foreground">{contractor.email}</p>
        </div>
        <Badge className={statusColors[contractor.status ?? 'pending'] || statusColors.pending}>
          {contractor.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contact Name</p>
                  <p className="font-medium">{contractor.contactName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{contractor.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  <p className="font-medium">
                    {contractor.website ? (
                      <a
                        href={contractor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {contractor.website}
                      </a>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">License #</p>
                  <p className="font-medium">{contractor.licenseNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Years in Business</p>
                  <p className="font-medium">{contractor.yearsInBusiness || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employee Count</p>
                  <p className="font-medium">{contractor.employeeCount || '-'}</p>
                </div>
              </div>

              {contractor.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="mt-1">{contractor.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categoryLabels.length > 0 ? (
                  categoryLabels.map((label) => (
                    <Badge key={label} variant="outline">
                      {label}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No categories selected</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {cities.length > 0 ? (
                  cities.map((city) => (
                    <Badge key={city} variant="outline">
                      {city}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No service areas selected</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Leads ({leadAssignments?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {!leadAssignments || leadAssignments.length === 0 ? (
                <p className="text-muted-foreground">No leads assigned yet</p>
              ) : (
                <div className="space-y-3">
                  {leadAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">Lead #{assignment.leadId}</p>
                        <p className="text-xs text-muted-foreground">
                          {assignment.createdAt
                            ? new Date(assignment.createdAt).toLocaleDateString()
                            : '-'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{assignment.status}</Badge>
                        {assignment.priceCharged && (
                          <span className="text-sm font-medium">${assignment.priceCharged}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent>
              <ContractorStatusForm
                contractorId={contractor.id}
                currentStatus={contractor.status ?? 'pending'}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium capitalize">{contractor.billingPlan?.replace('_', ' ') || 'Per Lead'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stripe Customer</p>
                <p className="font-medium text-xs">
                  {contractor.stripeCustomerId || 'Not set up'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leads This Month</p>
                <p className="font-medium">{contractor.leadsThisMonth ?? 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Billing</CardTitle>
            </CardHeader>
            <CardContent>
              {!billingHistory || billingHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No billing history</p>
              ) : (
                <div className="space-y-2">
                  {billingHistory.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {record.createdAt
                          ? new Date(record.createdAt).toLocaleDateString()
                          : '-'}
                      </span>
                      <span className="font-medium">${record.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Public Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/contractor/${contractor.slug}`}
                target="_blank"
                className="text-primary hover:underline"
              >
                View public profile →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
