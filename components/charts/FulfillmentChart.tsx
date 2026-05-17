'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface FulfillmentChartProps {
  delivered: number;
  partial: number;
  cancelled: number;
}

const COLORS = ['#1C7A52', '#F59E0B', '#EF4444'];
const LABELS = ['Delivered', 'Partial', 'Cancelled'];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '8px 12px', fontSize: 12 }}>
      <strong style={{ color: payload[0].payload.fill }}>{payload[0].name}</strong>: {payload[0].value} orders
    </div>
  );
};

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function FulfillmentChart({ delivered, partial, cancelled }: FulfillmentChartProps) {
  const data = [
    { name: 'Delivered', value: delivered },
    { name: 'Partial',   value: partial },
    { name: 'Cancelled', value: cancelled },
  ].filter(d => d.value > 0);

  return (
    <div className="chart-container" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={55} outerRadius={88}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={renderLabel}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={COLORS[['Delivered','Partial','Cancelled'].indexOf(entry.name)]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle" iconSize={8}
            wrapperStyle={{ fontSize: 11.5, color: 'var(--text-muted)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
