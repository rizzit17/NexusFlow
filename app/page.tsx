'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalyticsSnapshot, useOperationalKPIs } from '@/store/useStore';
import { useSearchFilter } from '@/hooks/useSearchFilter';
import { SearchFilterBanner } from '@/components/ui/SearchFilterBanner';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PayoutTrendChart } from '@/components/charts/PayoutTrendChart';
import { FulfillmentChart } from '@/components/charts/FulfillmentChart';
import { RiderComparisonChart } from '@/components/charts/RiderComparisonChart';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { buildPayoutTrend } from '@/lib/analytics';
import { formatCurrency, formatPercent, formatVolume } from '@/lib/calculations';
import {
  IndianRupee, ShoppingCart, Users, TrendingUp,
  XCircle, Package, BarChart3
} from 'lucide-react';

export default function ExecutiveDashboard() {
  const router = useRouter();

  // First-visit gate: redirect to landing page if not yet seen
  useEffect(() => {
    if (!localStorage.getItem('ds_nexus_visited')) {
      router.replace('/intro');
    }
  }, [router]);

  const snap = useAnalyticsSnapshot();
  const ops = useOperationalKPIs();
  const { filteredOrders, filteredRiders, isSearchActive, matchCount } = useSearchFilter();

  const trend = buildPayoutTrend(filteredOrders);
  const payoutTrend = trend.length > 0 ? trend : [{ date: '—', payout: 0, orders: 0 }];

  const riderChartData = [...filteredRiders]
    .sort((a, b) => b.totalOrderPayout - a.totalOrderPayout)
    .slice(0, 5)
    .map(r => ({ name: r.riderName.split(' ')[0], payout: r.totalOrderPayout, orders: r.totalOrders }));

  const recentOrders = [...filteredOrders]
    .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())
    .slice(0, 8);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Executive Dashboard"
        description="DS Group Volumetric Rider Payout Model v2 — live workbook data"
        badge="Live"
      />

      {isSearchActive && <SearchFilterBanner matchCount={matchCount} entityLabel="orders" />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total Payout" value={formatCurrency(snap.totalPayout)} icon={<IndianRupee size={16} />} sub={`Daily: ${formatCurrency(snap.dailyPayout)}`} delay={0} />
        <KpiCard label="Total Orders" value={snap.totalOrders} sub={`${snap.deliveredCount} delivered · ${snap.partialCount} partial · ${snap.cancelledCount} cancelled`} icon={<ShoppingCart size={16} />} delay={50} />
        <KpiCard label="Active Riders" value={snap.uniqueRiders} sub="From Rider Summary sheet" icon={<Users size={16} />} delay={100} />
        <KpiCard label="Fleet Fulfillment" value={ops.overallFleetFulfillmentRate.displayPct} sub="Non-cancelled volume ratio" icon={<TrendingUp size={16} />} delay={150} />
        <KpiCard label="Cancellation Comp." value={formatCurrency(snap.cancellationComp)} sub={`Rate: ${ops.cancellationRate.displayPct}`} icon={<XCircle size={16} />} delay={200} />
        <KpiCard label="Delivered Volume" value={formatVolume(snap.totalDeliveredVolume)} sub={`${snap.bulkySkuCount} bulky SKU lines`} icon={<Package size={16} />} delay={250} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '20px 20px 16px' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Payout Trend</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>By delivery date from Order Payout sheet</div>
          </div>
          <PayoutTrendChart data={payoutTrend} />
        </div>
        <div className="card" style={{ padding: '20px 20px 16px' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Order Status</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Fleet distribution</div>
          </div>
          <FulfillmentChart delivered={snap.deliveredCount} partial={snap.partialCount} cancelled={snap.cancelledCount} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: '20px 20px 16px' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Top Riders by Payout</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Rider Summary sheet totals</div>
          </div>
          <RiderComparisonChart data={riderChartData} />
        </div>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Recent Orders</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Order ID</th><th>Rider</th><th>Status</th><th>Payout</th></tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.orderId}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 500 }}>{order.orderId}</td>
                    <td style={{ fontSize: 12.5 }}>{order.riderName.split(' ')[0]}</td>
                    <td><StatusBadge status={order.orderStatus} /></td>
                    <td style={{ fontWeight: 600, color: 'var(--ds-green-800)' }}>{formatCurrency(order.finalOrderPayout)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
