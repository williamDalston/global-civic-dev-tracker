'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LeadForm } from './lead-form';
import { PERMIT_CATEGORIES } from '@/lib/config/constants';

interface CTABannerProps {
  permitCategory?: string;
  cityName?: string;
  citySlug?: string;
  permitId?: number;
  id?: string;
  contractorCount?: number;
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

export function CTABanner({ permitCategory, cityName, citySlug, permitId, id, contractorCount }: CTABannerProps) {
  const [showForm, setShowForm] = useState(false);
  const [localContractorCount, setLocalContractorCount] = useState(contractorCount);
  const cta = (permitCategory && CATEGORY_CTA[permitCategory]) || DEFAULT_CTA;
  const categoryLabel = permitCategory
    ? PERMIT_CATEGORIES[permitCategory] || permitCategory
    : 'construction';

  useEffect(() => {
    if (citySlug && localContractorCount === undefined) {
      fetch(`/api/contractors/count?city=${citySlug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.count > 0) {
            setLocalContractorCount(data.count);
          }
        })
        .catch(() => {});
    }
  }, [citySlug, localContractorCount]);

  return (
    <Card id={id} className="border-primary/30 bg-primary/5">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-foreground">{cta.headline}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{cta.body}</p>
        {cityName && (
          <p className="mt-1 text-xs text-muted-foreground">
            Serving {cityName} and surrounding areas
          </p>
        )}

        {localContractorCount && localContractorCount > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
            <div className="flex -space-x-2">
              {[...Array(Math.min(localContractorCount, 3))].map((_, i) => (
                <div
                  key={i}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-primary text-[10px] font-bold text-primary-foreground"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="text-xs font-medium text-success">
              {localContractorCount} contractor{localContractorCount !== 1 ? 's' : ''} available in {cityName || 'your area'}
            </span>
          </div>
        )}

        {!showForm ? (
          <>
            <Button
              className="mt-4 w-full bg-cta text-cta-foreground shadow-lg shadow-cta/20 hover:bg-cta/90"
              onClick={() => setShowForm(true)}
            >
              Get Free {categoryLabel} Quotes
            </Button>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3 text-success" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Free, no obligation
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3 text-success" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Licensed pros
              </span>
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-lg border border-border bg-card p-4">
            <LeadForm
              permitId={permitId}
              workType={categoryLabel}
              citySlug={citySlug}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
