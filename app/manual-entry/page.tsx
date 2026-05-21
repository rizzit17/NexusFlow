'use client';

import { useState, Fragment } from 'react';
import { useStore } from '@/store/useStore';
import { useSearchFilter } from '@/hooks/useSearchFilter';
import { SearchFilterBanner } from '@/components/ui/SearchFilterBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { OrderPayout, SkuBreakdownRow, OrderStatus } from '@/types/workbook';
import { formatCurrency } from '@/lib/calculations';
import { Plus, Trash2, Save, Package, ChevronDown } from 'lucide-react';

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

const defaultForm = () => {
  const orderId = `ORD-${String(Date.now()).slice(-6)}`;
  return {
    orderId,
    riderId: '',
    riderName: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    orderStatus: 'Delivered' as OrderStatus,
    hubId: '',
    basePayout: 40,
    driftDistance: 0,
    cancellationReason: '',
    cancelledBy: 'Customer',
    cancellationCategory: 'Customer',
    skus: [emptySku(orderId, 'R-NEW')] as SkuBreakdownRow[],
  };
};

// ── Display helpers for the detail panel ─────────────────────
function dash(val: unknown): string {
  if (val === null || val === undefined || val === '' || val === 'N/A') return '—';
  return String(val);
}

export default function ManualEntryPage() {
  const { config, addOrderPayout, updateOrderPayout, deleteOrderPayout } = useStore();
  const addNotification = useStore(s => s.addNotification);
  const skuBreakdown = useStore(s => s.skuBreakdown);
  const { filteredOrders } = useSearchFilter();
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hubError, setHubError] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const hubs = config.hubs ?? [];

  // Cancellation payout % — the multiplier in calcCancellationMultiplier returns 1 when within
  // threshold, so effective payout = basePayout × 1. We read the existing multiplier value (1)
  // as 100% for display. The spec uses the existing logic, so we reflect it faithfully.
  const CANC_PCT = 1; // mirrors calcCancellationMultiplier returning 1 for valid cancellation

  const selectedHub = hubs.find(h => h.hubId === form.hubId) ?? null;

  const set = <K extends keyof ReturnType<typeof defaultForm>>(key: K, val: ReturnType<typeof defaultForm>[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleHubChange = (hubId: string) => {
    setHubError(false);
    const hub = hubs.find(h => h.hubId === hubId) ?? null;
    setForm(f => ({
      ...f,
      hubId,
      basePayout: hub ? hub.baseOrderPayout : f.basePayout,
    }));
  };

  const handleStatusChange = (status: OrderStatus) => {
    setForm(f => ({
      ...f,
      orderStatus: status,
      // Clear drift distance when switching away from Cancelled
      driftDistance: status !== 'Cancelled' ? 0 : f.driftDistance,
    }));
  };

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
      hubId: form.hubId || undefined,
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
      plannedDistance: 0,
      travelledDistance: 0,
      distanceEfficiency: 0,
      orderClassification: '',
    };

    return { order, skus };
  };

  const handleSave = () => {
    if (!form.hubId) {
      setHubError(true);
      return;
    }
    const { order, skus } = buildPayload();
    if (editingId) {
      updateOrderPayout(editingId, order, skus);
    } else {
      addOrderPayout(order, skus);
    }

    // Read back the recalculated order so classification + payout are final engine values
    const saved = useStore.getState().orderPayouts.find(o => o.orderId === order.orderId);
    const classification = saved?.orderClassification ?? '';
    const riderLabel = order.riderName || order.riderId || 'Unknown';

    addNotification({
      type: 'order_added',
      title: 'New order added',
      body: `${order.orderId} — ${riderLabel} — ${classification || order.orderStatus}`,
    });

    if (classification === 'Cancelled – Compensated') {
      addNotification({
        type: 'compensated',
        title: 'Cancellation compensated',
        body: `${order.orderId} — ${riderLabel} — ₹${(saved?.finalOrderPayout ?? 0).toFixed(2)} paid`,
      });
    } else if (
      classification === 'Cancelled – No Payout' &&
      !String(order.cancelledBy ?? '').startsWith('Dashboard -')
    ) {
      addNotification({
        type: 'no_payout',
        title: 'Cancellation — no payout',
        body: `${order.orderId} — ${riderLabel} — drift ${(order.driftDistance ?? 0).toFixed(2)} km exceeded threshold`,
      });
    }

    setForm(defaultForm());
    setEditingId(null);
    setHubError(false);
  };

  const handleEdit = (orderId: string) => {
    const order = useStore.getState().orderPayouts.find(o => o.orderId === orderId);
    if (!order) return;
    const skus = useStore.getState().skuBreakdown.filter(s => s.orderId === orderId);
    setEditingId(orderId);
    setHubError(false);
    setForm({
      orderId: order.orderId,
      riderId: order.riderId,
      riderName: order.riderName,
      deliveryDate: order.deliveryDate,
      orderStatus: order.orderStatus,
      hubId: order.hubId ?? '',
      basePayout: order.basePayout,
      driftDistance: order.driftDistance ?? 0,
      cancellationReason: order.cancellationReason,
      cancelledBy: order.cancelledBy,
      cancellationCategory: order.cancellationCategory,
      skus: skus.length ? skus : [emptySku(order.orderId, order.riderId)],
    });
  };

  // ── Cancellation hint logic ──────────────────────────────────
  const showCancHint = form.orderStatus === 'Cancelled' && !!selectedHub;
  const withinThreshold = showCancHint && form.driftDistance <= selectedHub!.driftThreshold;
  const cancPayout = selectedHub ? selectedHub.baseOrderPayout * CANC_PCT : 0;

  return (
    <div className="animate-fade-up">
      <PageHeader title="Manual Entry" description="Append to workbook dataset — saved automatically to your browser" />

      <SearchFilterBanner matchCount={filteredOrders.length} entityLabel="orders" />

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 20 }}>
            {editingId ? `Edit ${editingId}` : 'New Order + SKU Lines'}
          </div>

          {/* Row 1: Order ID + Delivery Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="label">Order ID</label>
              <input className="input" value={form.orderId} onChange={e => set('orderId', e.target.value)} disabled={!!editingId} />
            </div>
            <div>
              <label className="label">Delivery Date</label>
              <input className="input" type="date" value={form.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} />
            </div>
          </div>

          {/* Row 2: Hub (full width) */}
          <div style={{ marginBottom: 14 }}>
            <label className="label">Hub</label>
            <select
              className="input"
              value={form.hubId}
              onChange={e => handleHubChange(e.target.value)}
              style={hubError ? { borderColor: '#DC2626' } : undefined}
            >
              <option value="">Select Hub</option>
              {hubs.map(h => (
                <option key={h.hubId} value={h.hubId}>
                  {h.hubId} — {h.hubName}
                </option>
              ))}
            </select>
            {hubError && (
              <div style={{ fontSize: 11.5, color: '#DC2626', marginTop: 4 }}>
                Hub selection is required.
              </div>
            )}
            {hubs.length === 0 && (
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                No hubs configured — add hubs on the Hub Configuration page first.
              </div>
            )}
          </div>

          {/* Row 3: Order Status + Base Payout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="label">Order Status</label>
              <select className="input" value={form.orderStatus} onChange={e => handleStatusChange(e.target.value as OrderStatus)}>
                <option value="Delivered">Delivered</option>
                <option value="Partial">Partial</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label">Base Payout (₹)</label>
              <input className="input" type="number" value={form.basePayout} onChange={e => set('basePayout', Number(e.target.value))} />
            </div>
          </div>

          {/* Row 4: Rider ID + Rider Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div>
              <label className="label">Rider ID</label>
              <input className="input" value={form.riderId} onChange={e => set('riderId', e.target.value)} />
            </div>
            <div>
              <label className="label">Rider Name</label>
              <input className="input" value={form.riderName} onChange={e => set('riderName', e.target.value)} />
            </div>
          </div>

          {/* Cancellation fields — shown only when status is Cancelled */}
          {form.orderStatus === 'Cancelled' && (
            <div style={{ padding: 16, background: '#FEF2F2', borderRadius: 8, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 12 }}>
                <div>
                  <label className="label">Drift Distance (km)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={form.driftDistance}
                    onChange={e => set('driftDistance', Number(e.target.value))}
                  />
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

              {/* Change 4: Live cancellation rule hint */}
              {showCancHint && (
                <div
                  style={{
                    fontSize: 12,
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontWeight: 500,
                    background: withinThreshold ? '#DCFCE7' : '#FEE2E2',
                    color: withinThreshold ? '#166534' : '#991B1B',
                    border: `1px solid ${withinThreshold ? '#BBF7D0' : '#FECACA'}`,
                  }}
                >
                  ℹ️ {selectedHub!.hubName} threshold: {selectedHub!.driftThreshold} km —{' '}
                  within threshold pays {formatCurrency(cancPayout)}, beyond pays ₹0
                  {' '}
                  <span style={{ fontWeight: 600 }}>
                    ({withinThreshold ? `✓ Within threshold — ${formatCurrency(cancPayout)} applies` : `✗ Beyond threshold — ₹0 applies`})
                  </span>
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={14} /> SKU Lines (m³ unit volume)
            </span>
            <button className="btn btn-secondary" onClick={() => { ensureSkus(); addSkuRow(); }} style={{ fontSize: 12 }}>
              <Plus size={13} /> Add SKU
            </button>
          </div>

          {form.skus.map((sku, idx) => (
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
              <button className="btn btn-secondary" onClick={() => { setForm(defaultForm()); setEditingId(null); setHubError(false); }}>Cancel</button>
            )}
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Order Payout Records</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{filteredOrders.length} orders shown · click a row to expand</div>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: 560 }}>
            <table className="data-table">
              <thead>
                <tr><th>Order</th><th>Rider</th><th>Status</th><th>Payout</th><th></th></tr>
              </thead>
              <tbody>
                {[...filteredOrders].reverse().map(order => {
                  const isExpanded = expandedOrderId === order.orderId;
                  const orderHub = hubs.find(h => h.hubId === order.hubId);
                  const orderSkus = skuBreakdown.filter(s => s.orderId === order.orderId);

                  // Decide which cancellation fields to show
                  const showCancReason = !!(order.cancellationReason && order.cancellationReason !== 'N/A');
                  const showCancelledBy = !!(order.cancelledBy && order.cancelledBy !== 'N/A');

                  return (
                    <Fragment key={order.orderId}>
                      {/* ── Main data row ───────────────────────── */}
                      <tr
                        onClick={() => setExpandedOrderId(prev => prev === order.orderId ? null : order.orderId)}
                        style={{
                          cursor: 'pointer',
                          background: isExpanded ? 'var(--bg-hover, rgba(0,0,0,0.04))' : undefined,
                        }}
                      >
                        <td style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{order.orderId}</td>
                        <td>{order.riderName}</td>
                        <td><StatusBadge status={order.orderStatus} /></td>
                        <td style={{ fontWeight: 600, color: 'var(--ds-green-800)' }}>{formatCurrency(order.finalOrderPayout)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {/* Chevron rotates when expanded */}
                          <ChevronDown
                            size={14}
                            style={{
                              marginRight: 4,
                              verticalAlign: 'middle',
                              color: 'var(--text-muted)',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.15s ease',
                            }}
                          />
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: 11, padding: '4px 8px' }}
                            onClick={e => { e.stopPropagation(); handleEdit(order.orderId); }}
                          >Edit</button>
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: 11, padding: '4px 8px', color: '#DC2626' }}
                            onClick={e => { e.stopPropagation(); deleteOrderPayout(order.orderId); }}
                          >Del</button>
                        </td>
                      </tr>

                      {/* ── Inline detail panel ─────────────────── */}
                      {isExpanded && (
                        <tr key={`${order.orderId}-detail`}>
                          <td colSpan={5} style={{ padding: 0, border: 'none' }}>
                            <div style={{
                              background: 'var(--bg-default, #F9FAFB)',
                              borderTop: '1px solid var(--border)',
                              borderBottom: '1px solid var(--border)',
                              padding: '12px 16px',
                            }}>
                              {/* ── Info grid (4 columns) ── */}
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '12px 16px',
                                marginBottom: (showCancReason || showCancelledBy) ? 10 : 0,
                              }}>
                                {/* Hub ID */}
                                <div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hub ID</div>
                                  <div style={{ fontSize: 13 }}>{dash(order.hubId)}</div>
                                </div>
                                {/* Hub Name */}
                                <div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hub Name</div>
                                  <div style={{ fontSize: 13 }}>{orderHub ? orderHub.hubName : dash(order.hubId)}</div>
                                </div>
                                {/* Drift Distance — 0.00 km is valid for delivered orders */}
                                <div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Drift Distance</div>
                                  <div style={{ fontSize: 13 }}>
                                    {order.driftDistance !== null && order.driftDistance !== undefined
                                      ? `${Number(order.driftDistance).toFixed(2)} km`
                                      : '—'}
                                  </div>
                                </div>
                                {/* OTP Attempted */}
                                <div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>OTP Attempted</div>
                                  <div style={{ fontSize: 13 }}>{dash(order.otpAttempted)}</div>
                                </div>

                                {/* Order Volume */}
                                <div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Order Volume</div>
                                  <div style={{ fontSize: 13 }}>{order.totalOrderVolume.toFixed(4)} m³</div>
                                </div>
                                {/* Delivered Volume */}
                                <div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Delivered Vol</div>
                                  <div style={{ fontSize: 13 }}>{order.totalDeliveredVolume.toFixed(4)} m³</div>
                                </div>
                                {/* Fulfillment % — 0.0% is valid */}
                                <div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fulfillment %</div>
                                  <div style={{ fontSize: 13 }}>{(order.fulfillmentRatio * 100).toFixed(1)}%</div>
                                </div>
                                {/* Classification */}
                                <div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Classification</div>
                                  <div style={{ fontSize: 13 }}>{dash(order.orderClassification)}</div>
                                </div>
                              </div>

                              {/* ── Cancellation row (conditional) ── */}
                              {(showCancReason || showCancelledBy) && (
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(4, 1fr)',
                                  gap: '12px 16px',
                                  marginBottom: 10,
                                }}>
                                  {showCancReason && (
                                    <div style={{ gridColumn: 'span 2' }}>
                                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cancellation Reason</div>
                                      <div style={{ fontSize: 13 }}>{order.cancellationReason}</div>
                                    </div>
                                  )}
                                  {showCancelledBy && (
                                    <div style={{ gridColumn: 'span 2' }}>
                                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cancelled By</div>
                                      <div style={{ fontSize: 13 }}>{order.cancelledBy}</div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* ── SKU sub-table (shown only when skus exist) ── */}
                              {orderSkus.length > 0 && (
                                <div style={{ marginTop: 10 }}>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>SKUs</div>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                    <thead>
                                      <tr style={{ background: 'var(--bg-subtle, #F3F4F6)' }}>
                                        <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>SKU ID</th>
                                        <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Name</th>
                                        <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Ordered</th>
                                        <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Delivered</th>
                                        <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {orderSkus.map((sku, si) => {
                                        const partial = sku.deliveredQty < sku.orderedQty;
                                        return (
                                          <tr
                                            key={si}
                                            style={{
                                              background: partial ? 'rgba(251,191,36,0.08)' : undefined,
                                              borderBottom: '1px solid var(--border)',
                                            }}
                                          >
                                            <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>{sku.skuId || '—'}</td>
                                            <td style={{ padding: '4px 8px' }}>{sku.skuName || '—'}</td>
                                            <td style={{ padding: '4px 8px', textAlign: 'center' }}>{sku.orderedQty}</td>
                                            <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: partial ? 600 : undefined, color: partial ? '#B45309' : undefined }}>{sku.deliveredQty}</td>
                                            <td style={{ padding: '4px 8px' }}>{dash(sku.deliveryStatus)}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
