'use client';

import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { useSearchFilter } from '@/hooks/useSearchFilter';
import { SearchFilterBanner } from '@/components/ui/SearchFilterBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { CancellationReasonChart, DriftCompensationChart } from '@/components/charts/CancellationChart';
import {
  buildCancellationRecords,
  buildCancellationReasonStats,
  buildDriftTierStats,
} from '@/lib/analytics';
import { formatCurrency } from '@/lib/calculations';
import { XCircle, MapPin, IndianRupee } from 'lucide-react';

export default function CancellationsPage() {
  const { filteredOrders } = useSearchFilter();
  const config = useStore(s => s.config);

  const cancelled = useMemo(
    () => filteredOrders.filter(o => o.orderStatus === 'Cancelled'),
    [filteredOrders]
  );
  const records = useMemo(
    () => buildCancellationRecords(filteredOrders, config),
    [filteredOrders, config]
  );
  const reasonStats = useMemo(() => buildCancellationReasonStats(filteredOrders), [filteredOrders]);
  const driftStats = useMemo(() => buildDriftTierStats(filteredOrders), [filteredOrders]);
  const avgDrift = cancelled.length
    ? cancelled.reduce((s, o) => s + (o.driftDistance ?? 0), 0) / cancelled.length
    : 0;

  return (
    <div className="animate-fade-up">
      <PageHeader title="Cancellation Intelligence" description="Drift-based compensation — Config B4/B5/B6/B7/B8 tiers" />

      <SearchFilterBanner matchCount={records.length} entityLabel="cancellations" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Cancelled Orders" value={cancelled.length} icon={<XCircle size={16} />} />
        <KpiCard label="Compensation Paid" value={formatCurrency(cancelled.reduce((s, o) => s + o.finalOrderPayout, 0))} icon={<IndianRupee size={16} />} />
        <KpiCard label="Genuine Attempts" value={cancelled.filter(o => o.cancellationMultiplier > 0).length} sub={`Failed: ${cancelled.filter(o => o.cancellationMultiplier === 0).length}`} icon={<MapPin size={16} />} />
        <KpiCard label="Avg Drift" value={`${avgDrift.toFixed(2)} km`} icon={<MapPin size={16} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Cancellation Reasons</div>
          <CancellationReasonChart data={reasonStats} />
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>Drift Compensation Tiers</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 14 }}>
            Paid = Drift ≤ Hub Threshold (100% Payout) ·
            Unpaid = Drift &gt; Hub Threshold (0% Payout)
          </div>
          <DriftCompensationChart data={driftStats} />
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>Cancellation Detail Log</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th><th>Rider</th><th>Date</th><th>Drift</th>
                <th>Reason</th><th>By</th><th>Category</th><th>Multiplier</th><th>Payout</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const order = filteredOrders.find(o => o.orderId === r.orderId);
                return (
                  <tr key={r.orderId}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{r.orderId}</td>
                    <td>{r.riderName}</td>
                    <td>{r.deliveryDate}</td>
                    <td style={{ fontWeight: 600 }}>{r.driftKm.toFixed(2)} km</td>
                    <td>{r.reason}</td>
                    <td>{r.cancelledBy}</td>
                    <td>{order?.cancellationCategory ?? '—'}</td>
                    <td>{order?.cancellationMultiplier ?? 0}</td>
                    <td style={{ fontWeight: 700, color: 'var(--ds-green-800)' }}>{formatCurrency(r.payout)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
