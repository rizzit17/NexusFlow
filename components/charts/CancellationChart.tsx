'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface CancellationChartProps {
  data: { reason: string; count: number }[];
}

const COLORS = ['#EF4444', '#F97316', '#EAB308', '#8B5CF6', '#6B7280'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '8px 12px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label || payload[0]?.name}</div>
      <div>Count: <strong>{payload[0]?.value}</strong></div>
    </div>
  );
};

export function CancellationReasonChart({ data }: CancellationChartProps) {
  return (
    <div className="chart-container" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="reason" width={120} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-subtle)' }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DriftChartProps {
  data: { tier: string; count: number; payout: number }[];
}

export function DriftCompensationChart({ data }: DriftChartProps) {
  const TIER_COLORS = ['#1C7A52', '#F59E0B', '#EF4444'];
  return (
    <div className="chart-container" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={50} outerRadius={82}
            paddingAngle={3}
            dataKey="count"
            nameKey="tier"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={TIER_COLORS[index % TIER_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value} orders`, name]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11.5, color: 'var(--text-muted)' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
