'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  trend?: number;
  delay?: number;
}

export function KpiCard({ label, value, sub, icon, trend, delay = 0 }: KpiCardProps) {
  const trendDir = trend === undefined ? null : trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';

  return (
    <div
      className="kpi-card animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="icon-badge">{icon}</div>
        {trendDir && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11.5, fontWeight: 500,
            color: trendDir === 'up' ? '#059669' : trendDir === 'down' ? '#DC2626' : 'var(--text-faint)',
            background: trendDir === 'up' ? '#ECFDF5' : trendDir === 'down' ? '#FEF2F2' : '#F3F4F6',
            padding: '2px 7px', borderRadius: 99,
          }}>
            {trendDir === 'up' ? <TrendingUp size={11} /> : trendDir === 'down' ? <TrendingDown size={11} /> : <Minus size={11} />}
            {Math.abs(trend!).toFixed(1)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 25, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 3 }}>{sub}</div>
      )}
    </div>
  );
}
