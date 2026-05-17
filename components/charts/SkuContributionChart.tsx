'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SkuContributionChartProps {
  data: { name: string; volume: number }[];
}

const COLORS = ['#0F5C3B', '#1C7A52', '#2E8B57', '#3A9E67', '#48B076', '#5BBF8A', '#6ECF9E', '#81DFB2'];

export function SkuContributionChart({ data }: SkuContributionChartProps) {
  return (
    <div className="chart-container" style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v) => [`${Number(v ?? 0).toLocaleString('en-IN')} cm³`, 'Delivered Volume']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
          />
          <Bar dataKey="volume" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
