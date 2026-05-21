'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useSearchFilter } from '@/hooks/useSearchFilter';
import { SearchFilterBanner } from '@/components/ui/SearchFilterBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { FilterBar } from '@/components/ui/FilterBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatPercent } from '@/lib/calculations';
import { IndianRupee, TrendingUp, MapPin, ShoppingCart } from 'lucide-react';

const FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Partial', label: 'Partial' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export default function OrderPayoutPage() {
  const { filteredOrders } = useSearchFilter();
  const config = useStore(s => s.config);
  const [filter, setFilter] = useState('ALL');

  const filtered = useMemo(() => {
    if (filter === 'ALL') return filteredOrders;
    return filteredOrders.filter(o => o.orderStatus === filter);
  }, [filteredOrders, filter]);

  const totalPayout = filteredOrders.reduce((s, o) => s + o.finalOrderPayout, 0);
  const nonCancelled = filteredOrders.filter(o => o.orderStatus !== 'Cancelled');
  const avgFulfillment = nonCancelled.length
    ? nonCancelled.reduce((s, o) => s + o.fulfillmentRatio, 0) / nonCancelled.length
    : 0;
  const cancelled = filteredOrders.filter(o => o.orderStatus === 'Cancelled');
  const avgDrift = cancelled.length
    ? cancelled.reduce((s, o) => s + (o.driftDistance ?? 0), 0) / cancelled.length
    : 0;

  return (
    <div className="animate-fade-up">
      <PageHeader title="Order Payout" description="Order Payout sheet — exact workbook values and formulas" />

      <SearchFilterBanner matchCount={filtered.length} entityLabel="orders" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total Orders" value={filteredOrders.length} icon={<ShoppingCart size={16} />} />
        <KpiCard label="Total Payout" value={formatCurrency(totalPayout)} icon={<IndianRupee size={16} />} />
        <KpiCard label="Avg Fulfillment" value={formatPercent(avgFulfillment)} sub="Excludes cancelled" icon={<TrendingUp size={16} />} />
        <KpiCard label="Avg Cancel Drift" value={`${avgDrift.toFixed(2)} km`} icon={<MapPin size={16} />} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Order Payout Table</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
              finalOrderPayout = basePayout × fulfillmentRatio (or × cancellationMultiplier)
            </div>
          </div>
          <FilterBar filters={FILTERS} active={filter} onChange={setFilter} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th><th>Rider</th><th>Date</th><th>Status</th>
                <th>Classification</th><th>Order Vol</th><th>Delivered Vol</th>
                <th>Fulfillment</th><th>Drift</th><th>Dist. Eff.</th><th>Payout</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.orderId}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 500 }}>{order.orderId}</td>
                  <td>{order.riderName}</td>
                  <td>{order.deliveryDate}</td>
                  <td><StatusBadge status={order.orderStatus} /></td>
                  <td style={{ fontSize: 12 }}>{order.orderClassification}</td>
                  <td>{order.totalOrderVolume.toFixed(4)}</td>
                  <td>{order.totalDeliveredVolume.toFixed(4)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--ds-green-800)' }}>
                    {order.orderStatus === 'Cancelled' ? '—' : formatPercent(order.fulfillmentRatio)}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {order.orderStatus === 'Cancelled' ? (
                      <>
                        <div>{order.driftDistance?.toFixed(2)} km</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
                          {order.cancellationMultiplier > 0 ? "Paid" : "Unpaid"}
                        </div>
                      </>
                    ) : '—'}
                  </td>
                  <td>{(order.distanceEfficiency * 100).toFixed(1)}%</td>
                  <td style={{ fontWeight: 700, color: 'var(--ds-green-900)' }}>{formatCurrency(order.finalOrderPayout)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
