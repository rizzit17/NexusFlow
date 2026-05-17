'use client';

import { useMemo, useState } from 'react';
import { useSearchFilter } from '@/hooks/useSearchFilter';
import { SearchFilterBanner } from '@/components/ui/SearchFilterBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { FilterBar } from '@/components/ui/FilterBar';
import { SkuContributionChart } from '@/components/charts/SkuContributionChart';
import { buildSkuContribution, buildSkuTableRows } from '@/lib/analytics';
import { formatPercent, formatVolume, formatCurrency } from '@/lib/calculations';
import { Package, AlertTriangle, Box, Layers } from 'lucide-react';

const FILTERS = [
  { value: 'ALL', label: 'All SKUs' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'MISSING', label: 'Missing' },
  { value: 'BULKY', label: 'Bulky' },
  { value: 'HIGHVOL', label: 'High Vol' },
];

export default function SkuBreakdownPage() {
  const { filteredSkus } = useSearchFilter();
  const [filter, setFilter] = useState('ALL');

  const rows = useMemo(() => buildSkuTableRows(filteredSkus), [filteredSkus]);

  const filtered = useMemo(() => {
    if (filter === 'PARTIAL') return rows.filter(r => r.isPartial);
    if (filter === 'MISSING') return rows.filter(r => r.isMissing);
    if (filter === 'BULKY') return rows.filter(r => r.isBulky);
    if (filter === 'HIGHVOL') return rows.filter(r => r.highVolumeSkuFlag === 'HIGH VOL');
    return rows;
  }, [rows, filter]);

  const chartData = useMemo(() => buildSkuContribution(filteredSkus), [filteredSkus]);

  return (
    <div className="animate-fade-up">
      <PageHeader title="SKU Breakdown" description="SKU-level volumetric delivery and payout contribution (workbook exact)" />

      <SearchFilterBanner matchCount={filtered.length} entityLabel="SKU rows" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="SKU Line Items" value={rows.length} icon={<Layers size={16} />} />
        <KpiCard label="Partial Deliveries" value={rows.filter(r => r.isPartial).length} icon={<AlertTriangle size={16} />} />
        <KpiCard label="Missing SKUs" value={rows.filter(r => r.isMissing).length} icon={<Package size={16} />} />
        <KpiCard label="Bulky SKUs" value={rows.filter(r => r.isBulky).length} icon={<Box size={16} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>SKU Delivery Table</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Exact values from SKU Breakdown sheet</div>
            </div>
            <FilterBar filters={FILTERS} active={filter} onChange={setFilter} />
          </div>
          <div style={{ overflowX: 'auto', maxHeight: 420 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th><th>SKU</th><th>Ordered</th><th>Delivered</th>
                  <th>SKU Vol (m³)</th><th>Fulfillment</th><th>Payout Contrib.</th><th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={`${row.orderId}-${row.skuId}-${i}`}>
                    <td style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{row.orderId}</td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 12.5 }}>{row.skuName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{row.skuId}</div>
                    </td>
                    <td>{row.orderedQty}</td>
                    <td style={{ fontWeight: row.deliveredQty < row.orderedQty ? 600 : 400 }}>{row.deliveredQty}</td>
                    <td>{row.deliveredSkuVol.toFixed(4)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--ds-green-800)' }}>{formatPercent(row.skuFulfillmentPct)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(row.skuPayoutContribution)}</td>
                    <td style={{ fontSize: 11 }}>
                      {row.bulkySkuFlag && <span className="badge badge-partial" style={{ marginRight: 4 }}>{row.bulkySkuFlag}</span>}
                      {row.highVolumeSkuFlag && <span className="badge badge-partial" style={{ marginRight: 4 }}>{row.highVolumeSkuFlag}</span>}
                      {row.isMissing && <span className="badge badge-cancelled">Missing</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card" style={{ padding: '20px 20px 16px' }}>
          <div style={{ marginBottom: 14, fontSize: 13.5, fontWeight: 600 }}>Top SKU Volume Contribution</div>
          <SkuContributionChart data={chartData} />
        </div>
      </div>
    </div>
  );
}
