'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PERMIT_CATEGORIES } from '@/lib/config/constants';

interface CTABannerProps {
  permitCategory?: string;
  cityName?: string;
  citySlug?: string;
  onGetQuotes?: () => void;
}

const CATEGORY_CTA: Record<string, { headline: string; body: string }> = {
  'new-construction': {
    headline: 'Building Something New?',
    body: 'Connect with licensed general contractors experienced in new construction projects in your area.',
  },
  renovation: {
    headline: 'Planning a Renovation?',
    body: 'Get matched with top-rated renovation contractors who know your neighborhood.',
  },
  demolition: {
    headline: 'Need Demolition Services?',
    body: 'Find certified demolition contractors with proper licensing and insurance.',
  },
  electrical: {
    headline: 'Need an Electrician?',
    body: 'Connect with licensed electricians who specialize in projects like this.',
  },
  plumbing: {
    headline: 'Need a Plumber?',
    body: 'Find licensed plumbers experienced with projects in your area.',
  },
  roofing: {
    headline: 'Need Roofing Work?',
    body: 'Get quotes from certified roofing contractors in your neighborhood.',
  },
};

const DEFAULT_CTA = {
  headline: 'Planning a Similar Project?',
  body: 'Get matched with verified local contractors who specialize in this type of work.',
};

export function CTABanner({ permitCategory, cityName, citySlug, onGetQuotes }: CTABannerProps) {
  const cta = (permitCategory && CATEGORY_CTA[permitCategory]) || DEFAULT_CTA;
  const categoryLabel = permitCategory
    ? PERMIT_CATEGORIES[permitCategory] || permitCategory
    : 'construction';

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-foreground">{cta.headline}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{cta.body}</p>
        {cityName && (
          <p className="mt-1 text-xs text-muted-foreground">
            Serving {cityName} and surrounding areas
          </p>
        )}
        <Button className="mt-4 w-full" onClick={onGetQuotes}>
          Get Free {categoryLabel} Quotes
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Free, no obligation — takes 30 seconds
        </p>
      </CardContent>
    </Card>
  );
}
