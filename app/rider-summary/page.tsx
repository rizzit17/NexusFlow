'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useSearchFilter } from '@/hooks/useSearchFilter';
import { SearchFilterBanner } from '@/components/ui/SearchFilterBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { RiderComparisonChart } from '@/components/charts/RiderComparisonChart';
import { formatCurrency, formatPercent, formatVolume } from '@/lib/calculations';
import { Users, IndianRupee, ChevronDown, ChevronRight, Calendar } from 'lucide-react';

export default function RiderSummaryPage() {
  const { filteredRiders, filteredOrders } = useSearchFilter();
  const config = useStore(s => s.config);
  const [expanded, setExpanded] = useState<string | null>(filteredRiders[0]?.riderId ?? null);

  const sorted = [...filteredRiders].sort((a, b) => b.totalOrderPayout - a.totalOrderPayout);
  const chartData = sorted.map(r => ({
    name: r.riderName.split(' ')[0],
    payout: r.totalOrderPayout,
    orders: r.totalOrders,
  }));

  const getRiderOrdersByDate = (riderId: string) => {
    const byDate = new Map<string, typeof filteredOrders>();
    filteredOrders
      .filter(o => o.riderId === riderId)
      .forEach(o => {
        const list = byDate.get(o.deliveryDate) ?? [];
        list.push(o);
        byDate.set(o.deliveryDate, list);
      });
    return Array.from(byDate.entries()).sort(([a], [b]) => b.localeCompare(a));
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Rider Summary"
        description={`Rider Summary sheet · Reference date: ${config.referenceDate}`}
      />

      <SearchFilterBanner matchCount={sorted.length} entityLabel="riders" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Active Riders" value={sorted.length} icon={<Users size={16} />} />
        <KpiCard label="Combined Payout" value={formatCurrency(sorted.reduce((s, r) => s + r.totalOrderPayout, 0))} icon={<IndianRupee size={16} />} />
        <KpiCard label="Top Rider" value={sorted[0]?.riderName ?? '—'} sub={sorted[0] ? formatCurrency(sorted[0].totalOrderPayout) : undefined} icon={<Users size={16} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
        <div className="card" style={{ padding: '20px 20px 16px' }}>
          <div style={{ marginBottom: 14, fontSize: 13.5, fontWeight: 600 }}>Rider Payout Comparison</div>
          <RiderComparisonChart data={chartData} />
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Rider Performance</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
              Daily / weekly / monthly payouts from workbook formulas
            </div>
          </div>
          {sorted.map(rider => {
            const isOpen = expanded === rider.riderId;
            return (
              <div key={rider.riderId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : rider.riderId)}
                  style={{ width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                >
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{rider.riderName}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {rider.totalOrders} orders · {rider.fullyDelivered} delivered · {rider.partialOrders} partial · {rider.cancelledOrders} cancelled
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ds-green-800)' }}>{formatCurrency(rider.totalOrderPayout)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                      Daily {formatCurrency(rider.dailyPayout)} · Weekly {formatCurrency(rider.weeklyPayout)}
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 20px 16px 46px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12, fontSize: 11 }}>
                      <div><span style={{ color: 'var(--text-faint)' }}>Monthly</span><br /><strong>{formatCurrency(rider.monthlyPayout)}</strong></div>
                      <div><span style={{ color: 'var(--text-faint)' }}>Cancel Comp</span><br /><strong>{formatCurrency(rider.cancellationCompensation)}</strong></div>
                      <div><span style={{ color: 'var(--text-faint)' }}>Avg Fulfillment</span><br /><strong>{formatPercent(rider.avgFulfillmentRatio)}</strong></div>
                      <div><span style={{ color: 'var(--text-faint)' }}>Volume</span><br /><strong>{formatVolume(rider.totalDeliveredVolume)}</strong></div>
                    </div>
                    <table className="data-table" style={{ fontSize: 12 }}>
                      <thead>
                        <tr><th>Date</th><th>Orders</th><th>Payout</th></tr>
                      </thead>
                      <tbody>
                        {getRiderOrdersByDate(rider.riderId).map(([date, orders]) => (
                          <tr key={date}>
                            <td>{date}</td>
                            <td>{orders.length}</td>
                            <td style={{ fontWeight: 600, color: 'var(--ds-green-800)' }}>
                              {formatCurrency(orders.reduce((s, o) => s + o.finalOrderPayout, 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
