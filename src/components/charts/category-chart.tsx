'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  'new-construction': '#22c55e',
  renovation: '#3b82f6',
  demolition: '#ef4444',
  electrical: '#f59e0b',
  plumbing: '#06b6d4',
  hvac: '#8b5cf6',
  roofing: '#ec4899',
  mechanical: '#6366f1',
  'fire-safety': '#f97316',
  signage: '#14b8a6',
  general: '#6b7280',
  other: '#6b7280',
};

export interface CategoryData {
  category: string;
  count: number;
}

interface CategoryChartProps {
  data: CategoryData[];
  height?: number;
}

function formatLabel(cat: string): string {
  return cat
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CategoryChart({ data, height = 300 }: CategoryChartProps) {
  const chartData = data.map((d) => ({
    name: formatLabel(d.category),
    value: d.count,
    category: d.category,
  }));

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-border bg-card"
        style={{ height }}
      >
        <p className="text-muted-foreground">No category data available yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Permits by Category</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'hsl(var(--foreground))',
            }}
            formatter={(value) => [Number(value).toLocaleString(), 'Permits']}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={CATEGORY_COLORS[entry.category] ?? '#6b7280'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
