// ============================================================
// DS NexusFlow — Analytics (workbook data)
// ============================================================

import type { OrderPayout, SkuBreakdownRow } from '@/types/workbook';

import type { WorkbookConfig } from '@/types/workbook';

export function buildPayoutTrend(orderPayouts: OrderPayout[]) {
  const byDate = new Map<string, { payout: number; orders: number }>();
  orderPayouts.forEach(o => {
    const existing = byDate.get(o.deliveryDate) ?? { payout: 0, orders: 0 };
    byDate.set(o.deliveryDate, {
      payout: existing.payout + o.finalOrderPayout,
      orders: existing.orders + 1,
    });
  });
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      payout: parseFloat(data.payout.toFixed(2)),
      orders: data.orders,
    }));
}

export function buildCancellationRecords(
  orderPayouts: OrderPayout[],
  config: WorkbookConfig
) {
  return orderPayouts
    .filter(o => o.orderStatus === 'Cancelled')
    .map(o => ({
      orderId: o.orderId,
      riderName: o.riderName,
      deliveryDate: o.deliveryDate,
      driftKm: o.driftDistance ?? 0,
      reason: o.cancellationReason,
      cancelledBy: o.cancelledBy,
      payout: o.finalOrderPayout,
      tier: o.cancellationMultiplier > 0 ? "100% (Within Hub Threshold)" : "0% (Outside Hub Threshold)",
    }));
}

export function buildCancellationReasonStats(orderPayouts: OrderPayout[]) {
  const map = new Map<string, number>();
  orderPayouts
    .filter(o => o.orderStatus === 'Cancelled')
    .forEach(o => {
      const reason = o.cancellationReason || 'Not specified';
      map.set(reason, (map.get(reason) ?? 0) + 1);
    });
  return Array.from(map.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}

export function buildDriftTierStats(orderPayouts: OrderPayout[]) {
  const tiers = [
    { tier: 'Within Hub Threshold (Paid)', count: 0, payout: 0 },
    { tier: 'Outside Hub Threshold (Unpaid)', count: 0, payout: 0 },
  ];
  orderPayouts
    .filter(o => o.orderStatus === 'Cancelled')
    .forEach(o => {
      const payout = o.finalOrderPayout;
      if (o.cancellationMultiplier > 0) {
        tiers[0].count++;
        tiers[0].payout += payout;
      } else {
        tiers[1].count++;
        tiers[1].payout += payout;
      }
    });
  return tiers.map(t => ({ ...t, payout: parseFloat(t.payout.toFixed(2)) }));
}

export function buildSkuContribution(skuBreakdown: SkuBreakdownRow[]) {
  const map = new Map<string, { name: string; volume: number }>();
  skuBreakdown.forEach(sku => {
    const existing = map.get(sku.skuId) ?? { name: sku.skuName, volume: 0 };
    map.set(sku.skuId, {
      name: sku.skuName,
      volume: existing.volume + sku.deliveredSkuVol,
    });
  });
  return Array.from(map.values())
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 8)
    .map(s => ({
      name: s.name.length > 16 ? s.name.slice(0, 14) + '…' : s.name,
      volume: s.volume,
    }));
}

export function buildSkuTableRows(skuBreakdown: SkuBreakdownRow[]) {
  return skuBreakdown.map(sku => ({
    ...sku,
    isPartial: sku.deliveredQty > 0 && sku.deliveredQty < sku.orderedQty,
    isMissing: sku.deliveredQty === 0 && sku.orderedQty > 0,
    isBulky: sku.bulkySkuFlag === 'BULKY',
  }));
}
