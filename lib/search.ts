// ============================================================
// Global search across workbook entities
// ============================================================

import type { OrderPayout, SkuBreakdownRow, RiderSummaryRow } from '@/types/workbook';

export interface SearchMatchContext {
  active: boolean;
  orderIds: Set<string>;
  riderIds: Set<string>;
}

function includes(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle);
}

export function buildSearchContext(
  query: string,
  orderPayouts: OrderPayout[],
  skuBreakdown: SkuBreakdownRow[],
  riderSummary: RiderSummaryRow[]
): SearchMatchContext {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { active: false, orderIds: new Set(), riderIds: new Set() };
  }

  const orderIds = new Set<string>();
  const riderIds = new Set<string>();

  orderPayouts.forEach(o => {
    const hit =
      includes(o.orderId, q) ||
      includes(o.riderId, q) ||
      includes(o.riderName, q) ||
      includes(o.orderStatus, q) ||
      includes(o.orderClassification, q) ||
      includes(o.cancellationReason, q) ||
      includes(o.cancelledBy, q) ||
      includes(o.cancellationCategory, q) ||
      includes(o.deliveryDate, q);

    if (hit) {
      orderIds.add(o.orderId);
      riderIds.add(o.riderId);
    }
  });

  skuBreakdown.forEach(s => {
    const hit =
      includes(s.orderId, q) ||
      includes(s.skuId, q) ||
      includes(s.skuName, q) ||
      includes(s.category, q) ||
      includes(s.riderId, q) ||
      includes(s.deliveryStatus, q) ||
      (s.bulkySkuFlag && includes(s.bulkySkuFlag, q)) ||
      (s.highVolumeSkuFlag && includes(s.highVolumeSkuFlag, q));

    if (hit) {
      orderIds.add(s.orderId);
      riderIds.add(s.riderId);
    }
  });

  riderSummary.forEach(r => {
    const hit = includes(r.riderId, q) || includes(r.riderName, q);
    if (hit) riderIds.add(r.riderId);
  });

  // Expand: orders for matched riders
  if (riderIds.size > 0) {
    orderPayouts.forEach(o => {
      if (riderIds.has(o.riderId)) orderIds.add(o.orderId);
    });
    skuBreakdown.forEach(s => {
      if (riderIds.has(s.riderId)) orderIds.add(s.orderId);
    });
  }

  return { active: true, orderIds, riderIds };
}

export function filterOrderPayouts(
  orders: OrderPayout[],
  ctx: SearchMatchContext
): OrderPayout[] {
  if (!ctx.active) return orders;
  return orders.filter(o => ctx.orderIds.has(o.orderId));
}

export function filterSkuBreakdown(
  rows: SkuBreakdownRow[],
  ctx: SearchMatchContext
): SkuBreakdownRow[] {
  if (!ctx.active) return rows;
  return rows.filter(
    s => ctx.orderIds.has(s.orderId) || ctx.riderIds.has(s.riderId)
  );
}

export function filterRiderSummary(
  riders: RiderSummaryRow[],
  ctx: SearchMatchContext
): RiderSummaryRow[] {
  if (!ctx.active) return riders;
  return riders.filter(r => ctx.riderIds.has(r.riderId));
}

export interface SearchResultItem {
  type: 'order' | 'sku' | 'rider';
  id: string;
  label: string;
  sub: string;
  href: string;
}

export function buildSearchResults(
  query: string,
  orderPayouts: OrderPayout[],
  skuBreakdown: SkuBreakdownRow[],
  riderSummary: RiderSummaryRow[],
  limit = 12
): SearchResultItem[] {
  const ctx = buildSearchContext(query, orderPayouts, skuBreakdown, riderSummary);
  if (!ctx.active) return [];

  const results: SearchResultItem[] = [];

  orderPayouts
    .filter(o => ctx.orderIds.has(o.orderId))
    .slice(0, 5)
    .forEach(o => {
      results.push({
        type: 'order',
        id: o.orderId,
        label: o.orderId,
        sub: `${o.riderName} · ${o.orderStatus}`,
        href: '/order-payout',
      });
    });

  skuBreakdown
    .filter(s => ctx.orderIds.has(s.orderId))
    .slice(0, 5)
    .forEach(s => {
      results.push({
        type: 'sku',
        id: `${s.orderId}-${s.skuId}`,
        label: s.skuName,
        sub: `${s.skuId} · ${s.orderId}`,
        href: '/sku-breakdown',
      });
    });

  riderSummary
    .filter(r => ctx.riderIds.has(r.riderId))
    .slice(0, 4)
    .forEach(r => {
      results.push({
        type: 'rider',
        id: r.riderId,
        label: r.riderName,
        sub: `${r.riderId} · ${r.totalOrders} orders`,
        href: '/rider-summary',
      });
    });

  return results.slice(0, limit);
}
