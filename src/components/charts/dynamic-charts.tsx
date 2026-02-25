'use client';

import dynamic from 'next/dynamic';
import type { CategoryData } from './category-chart';
import type { TrendData } from './trend-chart';

const CategoryChartLazy = dynamic(
  () => import('./category-chart').then((m) => ({ default: m.CategoryChart })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-border bg-card">
        <p className="text-muted-foreground">Loading chart...</p>
      </div>
    ),
  }
);

const TrendChartLazy = dynamic(
  () => import('./trend-chart').then((m) => ({ default: m.TrendChart })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-border bg-card">
        <p className="text-muted-foreground">Loading chart...</p>
      </div>
    ),
  }
);

export function DynamicCategoryChart(props: { data: CategoryData[]; height?: number }) {
  return <CategoryChartLazy {...props} />;
}

export function DynamicTrendChart(props: { data: TrendData[]; height?: number }) {
  return <TrendChartLazy {...props} />;
}
