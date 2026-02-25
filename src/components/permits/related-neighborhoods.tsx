import Link from 'next/link';

interface NeighborhoodLink {
  name: string;
  slug: string;
  permitCount: number;
}

interface RelatedNeighborhoodsProps {
  neighborhoods: NeighborhoodLink[];
  countrySlug: string;
  citySlug: string;
  cityName: string;
  currentSlug?: string;
}

export function RelatedNeighborhoods({
  neighborhoods,
  countrySlug,
  citySlug,
  cityName,
  currentSlug,
}: RelatedNeighborhoodsProps) {
  const filtered = neighborhoods.filter((n) => n.slug !== currentSlug).slice(0, 8);

  if (filtered.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-foreground">
        Other Neighborhoods in {cityName}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((hood) => (
          <Link
            key={hood.slug}
            href={`/${countrySlug}/${citySlug}/${hood.slug}`}
            className="group rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/50"
          >
            <p className="text-sm font-medium text-foreground group-hover:text-primary">
              {hood.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {hood.permitCount} {hood.permitCount === 1 ? 'permit' : 'permits'}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
