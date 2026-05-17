'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface RiderComparisonChartProps {
  data: { name: string; payout: number; orders: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ color: 'var(--ds-green-800)', marginBottom: 2 }}>
        Payout: <strong>₹{payload[0]?.value?.toFixed(2)}</strong>
      </div>
    </div>
  );
};

const DS_GREEN_SHADES = ['#0F5C3B', '#1C7A52', '#2E8B57', '#3A9E67', '#48B076'];

export function RiderComparisonChart({ data }: RiderComparisonChartProps) {
  return (
    <div className="chart-container" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.8} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-subtle)' }} />
          <Bar dataKey="payout" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((_, index) => (
              <Cell key={index} fill={DS_GREEN_SHADES[index % DS_GREEN_SHADES.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
