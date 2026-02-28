import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { safeQuery } from '@/lib/db/safe-query';
import { getContractorBySlug, getContractorServiceAreas, getContractorCategories } from '@/lib/db/queries/contractors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SITE_NAME, SITE_URL, PERMIT_CATEGORIES } from '@/lib/config/constants';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const contractor = await safeQuery(() => getContractorBySlug(slug));

  if (!contractor || contractor.status !== 'active') {
    return { title: 'Contractor Not Found' };
  }

  const title = `${contractor.companyName} | Licensed Contractor | ${SITE_NAME}`;
  const description = contractor.description
    ? contractor.description.slice(0, 160)
    : `${contractor.companyName} is a licensed contractor. Get a free quote for your construction or renovation project.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/contractor/${slug}`,
      siteName: SITE_NAME,
      type: 'profile',
    },
  };
}

export default async function ContractorProfilePage({ params }: Props) {
  const { slug } = await params;
  const contractor = await safeQuery(() => getContractorBySlug(slug));

  if (!contractor || contractor.status !== 'active') {
    notFound();
  }

  const [serviceAreas, categories] = await Promise.all([
    safeQuery(() => getContractorServiceAreas(contractor.id)),
    safeQuery(() => getContractorCategories(contractor.id)),
  ]);

  const categoryLabels = (categories ?? []).map(
    (c) => PERMIT_CATEGORIES[c.category] || c.category
  );

  const cities = [...new Set((serviceAreas ?? []).map((a) => a.cityName).filter(Boolean))];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Civic Tracker
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                {contractor.logoUrl ? (
                  <img
                    src={contractor.logoUrl}
                    alt={contractor.companyName}
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10">
                    <span className="text-3xl font-bold text-primary">
                      {contractor.companyName.charAt(0)}
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  <h1 className="text-3xl font-bold">{contractor.companyName}</h1>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {contractor.insuranceVerified && (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        <CheckIcon className="mr-1 h-3 w-3" />
                        Verified Insurance
                      </Badge>
                    )}
                    {contractor.yearsInBusiness && (
                      <Badge variant="outline">
                        {contractor.yearsInBusiness}+ years in business
                      </Badge>
                    )}
                    {contractor.licenseNumber && (
                      <Badge variant="outline">
                        License #{contractor.licenseNumber}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {contractor.description && (
                <div className="mt-6">
                  <h2 className="font-semibold mb-2">About</h2>
                  <p className="text-muted-foreground">{contractor.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Services Offered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categoryLabels.map((label) => (
                  <Badge key={label} variant="outline" className="text-sm">
                    {label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <Badge key={city} variant="outline" className="text-sm">
                    {city}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Contact Person</p>
                <p className="font-medium">{contractor.contactName}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <a
                  href={`tel:${contractor.phone}`}
                  className="font-medium text-primary hover:underline"
                >
                  {formatPhone(contractor.phone)}
                </a>
              </div>

              {contractor.website && (
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  <a
                    href={contractor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {new URL(contractor.website).hostname}
                  </a>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  This contractor is a verified partner of {SITE_NAME}. Contact them directly for quotes and estimates.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
