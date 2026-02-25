'use client';

import dynamic from 'next/dynamic';
import type { MapPermit } from './permit-map';
import type { MapNeighborhood } from './neighborhood-map';

const PermitMapLazy = dynamic(() => import('./permit-map').then((m) => ({ default: m.PermitMap })), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-xl border border-border bg-card">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
});

const NeighborhoodMapLazy = dynamic(
  () => import('./neighborhood-map').then((m) => ({ default: m.NeighborhoodMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-border bg-card">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  }
);

export function DynamicPermitMap(props: {
  permits: MapPermit[];
  center: [number, number];
  zoom?: number;
  height?: string;
  baseUrl?: string;
}) {
  return <PermitMapLazy {...props} />;
}

export function DynamicNeighborhoodMap(props: {
  neighborhoods: MapNeighborhood[];
  center: [number, number];
  zoom?: number;
  height?: string;
  baseUrl: string;
}) {
  return <NeighborhoodMapLazy {...props} />;
}
