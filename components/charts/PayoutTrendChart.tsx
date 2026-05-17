'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, Legend
} from 'recharts';

interface PayoutTrendChartProps {
  data: { date: string; payout: number; orders: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.dataKey === 'payout' ? `₹${p.value}` : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export function PayoutTrendChart({ data }: PayoutTrendChartProps) {
  return (
    <div className="chart-container" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="payoutGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#1C7A52" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#1C7A52" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.8} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone" dataKey="payout" name="Total Payout"
            stroke="#1C7A52" strokeWidth={2}
            fill="url(#payoutGrad)"
            dot={false} activeDot={{ r: 4, fill: '#1C7A52', stroke: 'white', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
