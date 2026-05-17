'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useSearchFilter } from '@/hooks/useSearchFilter';
import { SearchFilterBanner } from '@/components/ui/SearchFilterBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { OrderPayout, SkuBreakdownRow, OrderStatus } from '@/types/workbook';
import { formatCurrency } from '@/lib/calculations';
import { Plus, Trash2, Save, Package } from 'lucide-react';

const emptySku = (orderId: string, riderId: string): SkuBreakdownRow => ({
  orderId,
  riderId,
  skuId: '',
  skuName: '',
  category: 'General',
  unitVolume: 0.001,
  orderedQty: 1,
  deliveredQty: 0,
  missingQty: 1,
  orderedSkuVol: 0,
  deliveredSkuVol: 0,
  volumeContribPct: 0,
  deliveryStatus: 'Not Delivered',
  skuFulfillmentPct: 0,
  skuPayoutContribution: 0,
  bulkySkuFlag: null,
  highVolumeSkuFlag: null,
});

const defaultForm = () => ({
  orderId: `ORD-${String(Date.now()).slice(-6)}`,
  riderId: '',
  riderName: '',
  deliveryDate: new Date().toISOString().split('T')[0],
  orderStatus: 'Delivered' as OrderStatus,
  basePayout: 40,
  driftDistance: 0,
  cancellationReason: '',
  cancelledBy: 'Customer',
  cancellationCategory: 'Customer',
  plannedDistance: 0,
  travelledDistance: 0,
  skus: [] as SkuBreakdownRow[],
});

export default function ManualEntryPage() {
  const { config, addOrderPayout, updateOrderPayout, deleteOrderPayout } = useStore();
  const { filteredOrders } = useSearchFilter();
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const set = <K extends keyof ReturnType<typeof defaultForm>>(key: K, val: ReturnType<typeof defaultForm>[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const ensureSkus = () => {
    if (form.skus.length === 0) {
      setForm(f => ({
        ...f,
        skus: [emptySku(f.orderId, f.riderId || 'R-NEW')],
      }));
    }
  };

  const updateSku = (idx: number, patch: Partial<SkuBreakdownRow>) =>
    setForm(f => ({ ...f, skus: f.skus.map((s, i) => (i === idx ? { ...s, ...patch } : s)) }));

  const addSkuRow = () =>
    setForm(f => ({
      ...f,
      skus: [...f.skus, emptySku(f.orderId, f.riderId || 'R-NEW')],
    }));

  const removeSkuRow = (idx: number) =>
    setForm(f => ({
      ...f,
      skus: f.skus.length > 1 ? f.skus.filter((_, i) => i !== idx) : f.skus,
    }));

  const buildPayload = (): { order: OrderPayout; skus: SkuBreakdownRow[] } => {
    const riderId = form.riderId || 'R-NEW';
    const skus = (form.skus.length ? form.skus : [emptySku(form.orderId, riderId)]).map(s => ({
      ...s,
      orderId: form.orderId,
      riderId,
    }));

    const order: OrderPayout = {
      orderId: form.orderId,
      riderId,
      riderName: form.riderName || 'Unknown Rider',
      deliveryDate: form.deliveryDate,
      orderStatus: form.orderStatus,
      basePayout: form.basePayout || config.basePayoutPerOrder,
      totalOrderVolume: 0,
      totalDeliveredVolume: 0,
      fulfillmentRatio: 0,
      driftDistance: form.orderStatus === 'Cancelled' ? form.driftDistance : null,
      cancellationMultiplier: 1,
      finalOrderPayout: 0,
      cancellationReason: form.orderStatus === 'Cancelled' ? form.cancellationReason : 'N/A',
      cancelledBy: form.orderStatus === 'Cancelled' ? form.cancelledBy : 'N/A',
      cancellationCategory: form.orderStatus === 'Cancelled' ? form.cancellationCategory : 'N/A',
      plannedDistance: form.plannedDistance,
      travelledDistance: form.travelledDistance,
      distanceEfficiency: 0,
      orderClassification: '',
    };

    return { order, skus };
  };

  const handleSave = () => {
    const { order, skus } = buildPayload();
    if (editingId) {
      updateOrderPayout(editingId, order, skus);
    } else {
      addOrderPayout(order, skus);
    }
    setForm(defaultForm());
    setEditingId(null);
  };

  const handleEdit = (orderId: string) => {
    const order = useStore.getState().orderPayouts.find(o => o.orderId === orderId);
    if (!order) return;
    const skus = useStore.getState().skuBreakdown.filter(s => s.orderId === orderId);
    setEditingId(orderId);
    setForm({
      orderId: order.orderId,
      riderId: order.riderId,
      riderName: order.riderName,
      deliveryDate: order.deliveryDate,
      orderStatus: order.orderStatus,
      basePayout: order.basePayout,
      driftDistance: order.driftDistance ?? 0,
      cancellationReason: order.cancellationReason,
      cancelledBy: order.cancelledBy,
      cancellationCategory: order.cancellationCategory,
      plannedDistance: order.plannedDistance,
      travelledDistance: order.travelledDistance,
      skus: skus.length ? skus : [emptySku(order.orderId, order.riderId)],
    });
  };

  return (
    <div className="animate-fade-up">
      <PageHeader title="Manual Entry" description="Append to workbook dataset — saved automatically to your browser" />

      <SearchFilterBanner matchCount={filteredOrders.length} entityLabel="orders" />

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 20 }}>
            {editingId ? `Edit ${editingId}` : 'New Order + SKU Lines'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div>
              <label className="label">Order ID</label>
              <input className="input" value={form.orderId} onChange={e => set('orderId', e.target.value)} disabled={!!editingId} />
            </div>
            <div>
              <label className="label">Delivery Date</label>
              <input className="input" type="date" value={form.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} />
            </div>
            <div>
              <label className="label">Order Status</label>
              <select className="input" value={form.orderStatus} onChange={e => set('orderStatus', e.target.value as OrderStatus)}>
                <option value="Delivered">Delivered</option>
                <option value="Partial">Partial</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label">Base Payout (₹)</label>
              <input className="input" type="number" value={form.basePayout} onChange={e => set('basePayout', Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Rider ID</label>
              <input className="input" value={form.riderId} onChange={e => set('riderId', e.target.value)} />
            </div>
            <div>
              <label className="label">Rider Name</label>
              <input className="input" value={form.riderName} onChange={e => set('riderName', e.target.value)} />
            </div>
          </div>

          {form.orderStatus === 'Cancelled' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20, padding: 16, background: '#FEF2F2', borderRadius: 8 }}>
              <div>
                <label className="label">Drift (km)</label>
                <input className="input" type="number" step="0.01" value={form.driftDistance} onChange={e => set('driftDistance', Number(e.target.value))} />
              </div>
              <div>
                <label className="label">Reason</label>
                <input className="input" value={form.cancellationReason} onChange={e => set('cancellationReason', e.target.value)} />
              </div>
              <div>
                <label className="label">Cancelled By</label>
                <input className="input" value={form.cancelledBy} onChange={e => set('cancelledBy', e.target.value)} />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label className="label">Planned Distance (km)</label>
              <input className="input" type="number" step="0.1" value={form.plannedDistance} onChange={e => set('plannedDistance', Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Travelled Distance (km)</label>
              <input className="input" type="number" step="0.1" value={form.travelledDistance} onChange={e => set('travelledDistance', Number(e.target.value))} />
            </div>
          </div>

          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={14} /> SKU Lines (m³ unit volume)
            </span>
            <button className="btn btn-secondary" onClick={() => { ensureSkus(); addSkuRow(); }} style={{ fontSize: 12 }}>
              <Plus size={13} /> Add SKU
            </button>
          </div>

          {(form.skus.length ? form.skus : [emptySku(form.orderId, form.riderId)]).map((sku, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr) auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
              <div>
                {idx === 0 && <label className="label">SKU ID</label>}
                <input className="input" value={sku.skuId} onChange={e => updateSku(idx, { skuId: e.target.value })} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                {idx === 0 && <label className="label">Name</label>}
                <input className="input" value={sku.skuName} onChange={e => updateSku(idx, { skuName: e.target.value })} />
              </div>
              <div>
                {idx === 0 && <label className="label">Unit Vol (m³)</label>}
                <input className="input" type="number" step="0.0001" value={sku.unitVolume} onChange={e => updateSku(idx, { unitVolume: Number(e.target.value) })} />
              </div>
              <div>
                {idx === 0 && <label className="label">Ordered</label>}
                <input className="input" type="number" value={sku.orderedQty} onChange={e => updateSku(idx, { orderedQty: Number(e.target.value) })} />
              </div>
              <div>
                {idx === 0 && <label className="label">Delivered</label>}
                <input className="input" type="number" value={sku.deliveredQty} onChange={e => updateSku(idx, { deliveredQty: Number(e.target.value) })} />
              </div>
              <button className="btn btn-danger" onClick={() => removeSkuRow(idx)} style={{ padding: '7px 9px' }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> {editingId ? 'Update' : 'Save'}</button>
            {editingId && (
              <button className="btn btn-secondary" onClick={() => { setForm(defaultForm()); setEditingId(null); }}>Cancel</button>
            )}
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Order Payout Records</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{filteredOrders.length} orders shown</div>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: 560 }}>
            <table className="data-table">
              <thead>
                <tr><th>Order</th><th>Rider</th><th>Status</th><th>Payout</th><th></th></tr>
              </thead>
              <tbody>
                {[...filteredOrders].reverse().map(order => (
                  <tr key={order.orderId}>
                    <td style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{order.orderId}</td>
                    <td>{order.riderName}</td>
                    <td><StatusBadge status={order.orderStatus} /></td>
                    <td style={{ fontWeight: 600, color: 'var(--ds-green-800)' }}>{formatCurrency(order.finalOrderPayout)}</td>
                    <td>
                      <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => handleEdit(order.orderId)}>Edit</button>
                      <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 8px', color: '#DC2626' }} onClick={() => deleteOrderPayout(order.orderId)}>Del</button>
                    </td>
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
