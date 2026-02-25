'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface TrendData {
  month: string;
  count: number;
}

interface TrendChartProps {
  data: TrendData[];
  height?: number;
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(m, 10) - 1]} ${year.slice(2)}`;
}

export function TrendChart({ data, height = 300 }: TrendChartProps) {
  const chartData = data.map((d) => ({
    name: formatMonth(d.month),
    permits: d.count,
  }));

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-border bg-card"
        style={{ height }}
      >
        <p className="text-muted-foreground">No trend data available yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Monthly Permit Trend</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="permitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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
          <Area
            type="monotone"
            dataKey="permits"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#permitGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
