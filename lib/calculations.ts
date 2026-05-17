// ============================================================
// DS NexusFlow — Excel Formula Engine (v2 workbook)
// Mirrors formulaMapping from extracted workbook JSON
// ============================================================

import type {
  WorkbookConfig,
  OrderPayout,
  SkuBreakdownRow,
  OrderStatus,
  RiderSummaryRow,
  FleetTotals,
  OperationalKPIs,
} from '@/types/workbook';

// ─── SKU-level (SKU Breakdown sheet) ────────────────────────

export function calcMissingQty(orderedQty: number, deliveredQty: number): number {
  return orderedQty - deliveredQty;
}

export function calcOrderedSkuVol(unitVolume: number, orderedQty: number): number {
  return unitVolume * orderedQty;
}

export function calcDeliveredSkuVol(unitVolume: number, deliveredQty: number): number {
  return unitVolume * deliveredQty;
}

export function calcSkuDeliveryStatus(deliveredQty: number, orderedQty: number): string {
  if (deliveredQty === 0) return 'Not Delivered';
  if (deliveredQty >= orderedQty) return 'Fully Delivered';
  return 'Partially Delivered';
}

export function calcSkuFulfillmentPct(deliveredQty: number, orderedQty: number): number {
  if (orderedQty === 0) return 0;
  return deliveredQty / orderedQty;
}

export function calcBulkySkuFlag(unitVolume: number, config: WorkbookConfig): string | null {
  return unitVolume >= config.bulkySkuUnitVolThreshold ? 'BULKY' : null;
}

export function calcHighVolumeSkuFlag(orderedSkuVol: number, config: WorkbookConfig): string | null {
  return orderedSkuVol >= config.highVolOrderedVolThreshold ? 'HIGH VOL' : null;
}

export function calcVolumeContribPct(
  deliveredSkuVol: number,
  orderDeliveredVol: number
): number {
  if (orderDeliveredVol === 0) return 0;
  return parseFloat((deliveredSkuVol / orderDeliveredVol).toFixed(4));
}

export function calcSkuPayoutContribution(
  deliveredSkuVol: number,
  orderDeliveredVol: number,
  config: WorkbookConfig
): number {
  if (orderDeliveredVol === 0) return 0;
  return parseFloat(
    (config.basePayoutPerOrder * (deliveredSkuVol / orderDeliveredVol)).toFixed(3)
  );
}

// ─── Order-level (Order Payout sheet) ───────────────────────

export function calcTotalOrderVolumeFromSkus(
  skus: SkuBreakdownRow[],
  orderId: string
): number {
  return parseFloat(
    skus
      .filter(s => s.orderId === orderId)
      .reduce((sum, s) => sum + s.orderedSkuVol, 0)
      .toFixed(4)
  );
}

export function calcTotalDeliveredVolumeFromSkus(
  skus: SkuBreakdownRow[],
  orderId: string
): number {
  return parseFloat(
    skus
      .filter(s => s.orderId === orderId)
      .reduce((sum, s) => sum + s.deliveredSkuVol, 0)
      .toFixed(4)
  );
}

export function calcFulfillmentRatio(
  orderStatus: OrderStatus,
  totalDeliveredVolume: number,
  totalOrderVolume: number
): number {
  if (orderStatus === 'Cancelled') return 0;
  if (totalOrderVolume === 0) return 0;
  return parseFloat((totalDeliveredVolume / totalOrderVolume).toFixed(4));
}

export function calcCancellationMultiplier(
  orderStatus: OrderStatus,
  driftKm: number | null,
  config: WorkbookConfig
): number {
  if (orderStatus !== 'Cancelled') return 1;
  const drift = driftKm ?? 999;
  if (drift <= config.driftNearThreshold) return config.nearAttemptMultiplier;
  if (drift <= config.driftMidThreshold) return config.midAttemptMultiplier;
  return config.noAttemptMultiplier;
}

export function calcFinalOrderPayout(
  orderStatus: OrderStatus,
  basePayout: number,
  fulfillmentRatio: number,
  cancellationMultiplier: number
): number {
  if (orderStatus === 'Cancelled') {
    return parseFloat((basePayout * cancellationMultiplier).toFixed(3));
  }
  return parseFloat((basePayout * fulfillmentRatio).toFixed(3));
}

export function calcDistanceEfficiency(plannedKm: number, travelledKm: number): number {
  if (travelledKm === 0) return 0;
  return parseFloat((plannedKm / travelledKm).toFixed(4));
}

export function calcOrderClassification(
  orderStatus: OrderStatus,
  cancellationMultiplier: number
): string {
  if (orderStatus === 'Delivered') return 'Fully Delivered';
  if (orderStatus === 'Partial') return 'Partially Delivered';
  if (orderStatus === 'Cancelled' && cancellationMultiplier > 0) {
    return 'Cancelled With Attempt';
  }
  return 'Cancelled Without Attempt';
}

export function getCancellationPayoutTier(driftKm: number, config: WorkbookConfig): string {
  if (driftKm <= config.driftNearThreshold) return '50% (Genuine Attempt)';
  if (driftKm <= config.driftMidThreshold) return '25% (Near Attempt)';
  return '0% (No Attempt)';
}

// ─── Rider / Fleet aggregations ─────────────────────────────

function parseDate(d: string): Date {
  return new Date(d + 'T00:00:00');
}

export function calcRiderSummaries(
  orderPayouts: OrderPayout[],
  config: WorkbookConfig
): RiderSummaryRow[] {
  const refDate = parseDate(config.referenceDate);
  const weekStart = new Date(refDate);
  weekStart.setDate(refDate.getDate() - 6);
  const monthStart = new Date(refDate.getFullYear(), refDate.getMonth(), 1);

  const riderIds = [...new Set(orderPayouts.map(o => o.riderId))];

  return riderIds.map(riderId => {
    const orders = orderPayouts.filter(o => o.riderId === riderId);
    const riderName = orders[0]?.riderName ?? riderId;
    const nonCancelled = orders.filter(o => o.orderStatus !== 'Cancelled');

    const avgFulfillmentRatio = nonCancelled.length
      ? parseFloat(
          (
            nonCancelled.reduce((s, o) => s + o.fulfillmentRatio, 0) / nonCancelled.length
          ).toFixed(4)
        )
      : 0;

    const sumPayoutInRange = (from: Date, to: Date) =>
      orders
        .filter(o => {
          const d = parseDate(o.deliveryDate);
          return d >= from && d <= to;
        })
        .reduce((s, o) => s + o.finalOrderPayout, 0);

    const dailyPayout = parseFloat(
      sumPayoutInRange(refDate, refDate).toFixed(3)
    );
    const weeklyPayout = parseFloat(
      sumPayoutInRange(weekStart, refDate).toFixed(3)
    );
    const monthlyPayout = parseFloat(
      sumPayoutInRange(monthStart, refDate).toFixed(3)
    );

    return {
      riderId,
      riderName,
      totalOrders: orders.length,
      fullyDelivered: orders.filter(o => o.orderStatus === 'Delivered').length,
      partialOrders: orders.filter(o => o.orderStatus === 'Partial').length,
      cancelledOrders: orders.filter(o => o.orderStatus === 'Cancelled').length,
      totalDeliveredVolume: parseFloat(
        orders.reduce((s, o) => s + o.totalDeliveredVolume, 0).toFixed(4)
      ),
      avgFulfillmentRatio,
      cancellationCompensation: parseFloat(
        orders
          .filter(o => o.orderStatus === 'Cancelled')
          .reduce((s, o) => s + o.finalOrderPayout, 0)
          .toFixed(3)
      ),
      totalOrderPayout: parseFloat(
        orders.reduce((s, o) => s + o.finalOrderPayout, 0).toFixed(3)
      ),
      dailyPayout,
      weeklyPayout,
      monthlyPayout,
      genuineDeliveryAttempts: orders.filter(
        o => o.orderStatus === 'Cancelled' && o.cancellationMultiplier > 0
      ).length,
      failedAttempts: orders.filter(
        o => o.orderStatus === 'Cancelled' && o.cancellationMultiplier === 0
      ).length,
      cancellationCompCount: orders.filter(
        o => o.orderStatus === 'Cancelled' && o.finalOrderPayout > 0
      ).length,
    };
  });
}

export function calcFleetTotals(
  orderPayouts: OrderPayout[],
  riderSummary: RiderSummaryRow[],
  config: WorkbookConfig
): FleetTotals {
  const refDate = parseDate(config.referenceDate);
  const weekStart = new Date(refDate);
  weekStart.setDate(refDate.getDate() - 6);
  const monthStart = new Date(refDate.getFullYear(), refDate.getMonth(), 1);

  const nonCancelled = orderPayouts.filter(o => o.orderStatus !== 'Cancelled');
  const avgFulfillmentRatio = nonCancelled.length
    ? parseFloat(
        (
          nonCancelled.reduce((s, o) => s + o.fulfillmentRatio, 0) / nonCancelled.length
        ).toFixed(4)
      )
    : 0;

  const sumPayoutInRange = (from: Date, to: Date) =>
    orderPayouts
      .filter(o => {
        const d = parseDate(o.deliveryDate);
        return d >= from && d <= to;
      })
      .reduce((s, o) => s + o.finalOrderPayout, 0);

  return {
    totalOrders: orderPayouts.length,
    fullyDelivered: orderPayouts.filter(o => o.orderStatus === 'Delivered').length,
    partialOrders: orderPayouts.filter(o => o.orderStatus === 'Partial').length,
    cancelledOrders: orderPayouts.filter(o => o.orderStatus === 'Cancelled').length,
    totalDeliveredVolume: parseFloat(
      orderPayouts.reduce((s, o) => s + o.totalDeliveredVolume, 0).toFixed(4)
    ),
    avgFulfillmentRatio,
    cancellationCompensation: parseFloat(
      orderPayouts
        .filter(o => o.orderStatus === 'Cancelled')
        .reduce((s, o) => s + o.finalOrderPayout, 0)
        .toFixed(3)
    ),
    totalOrderPayout: parseFloat(
      orderPayouts.reduce((s, o) => s + o.finalOrderPayout, 0).toFixed(3)
    ),
    dailyPayout: parseFloat(sumPayoutInRange(refDate, refDate).toFixed(3)),
    weeklyPayout: parseFloat(sumPayoutInRange(weekStart, refDate).toFixed(3)),
    monthlyPayout: parseFloat(sumPayoutInRange(monthStart, refDate).toFixed(3)),
    genuineDeliveryAttempts: orderPayouts.filter(
      o => o.orderStatus === 'Cancelled' && o.cancellationMultiplier > 0
    ).length,
    failedAttempts: orderPayouts.filter(
      o => o.orderStatus === 'Cancelled' && o.cancellationMultiplier === 0
    ).length,
    cancellationCompCount: orderPayouts.filter(
      o => o.orderStatus === 'Cancelled' && o.finalOrderPayout > 0
    ).length,
  };
}

export function calcOperationalKPIs(
  orderPayouts: OrderPayout[],
  riderSummary: RiderSummaryRow[]
): OperationalKPIs {
  const nonCancelled = orderPayouts.filter(o => o.orderStatus !== 'Cancelled');
  const totalOrderedVol = nonCancelled.reduce((s, o) => s + o.totalOrderVolume, 0);
  const totalDeliveredVol = nonCancelled.reduce((s, o) => s + o.totalDeliveredVolume, 0);
  const deliveredOrders = orderPayouts.filter(o => o.orderStatus === 'Delivered');
  const cancelled = orderPayouts.filter(o => o.orderStatus === 'Cancelled');
  const withAttempt = cancelled.filter(o => o.cancellationMultiplier > 0);
  const withoutAttempt = cancelled.filter(o => o.cancellationMultiplier === 0);
  const genuine = riderSummary.reduce((s, r) => s + r.genuineDeliveryAttempts, 0);
  const failed = riderSummary.reduce((s, r) => s + r.failedAttempts, 0);

  const overallFleetFulfillmentRate =
    totalOrderedVol > 0 ? totalDeliveredVol / totalOrderedVol : 0;
  const avgPayoutPerDeliveredOrder =
    deliveredOrders.length > 0
      ? deliveredOrders.reduce((s, o) => s + o.finalOrderPayout, 0) / deliveredOrders.length
      : 0;
  const cancellationRate =
    orderPayouts.length > 0 ? cancelled.length / orderPayouts.length : 0;
  const totalVolumeUndelivered = parseFloat(
    (orderPayouts.reduce((s, o) => s + o.totalOrderVolume, 0) -
      orderPayouts.reduce((s, o) => s + o.totalDeliveredVolume, 0)).toFixed(4)
  );
  const totalPayoutAllRiders = orderPayouts.reduce((s, o) => s + o.finalOrderPayout, 0) * 2;
  const fleetGenuineAttemptRate =
    genuine + failed > 0 ? genuine / (genuine + failed) : 0;
  const avgDistanceEfficiency =
    orderPayouts.length > 0
      ? orderPayouts.reduce((s, o) => s + o.distanceEfficiency, 0) / orderPayouts.length
      : 0;

  return {
    overallFleetFulfillmentRate: {
      value: parseFloat(overallFleetFulfillmentRate.toFixed(4)),
      displayPct: `${(overallFleetFulfillmentRate * 100).toFixed(1)}%`,
    },
    avgPayoutPerDeliveredOrder: {
      value: parseFloat(avgPayoutPerDeliveredOrder.toFixed(2)),
      displayINR: `₹${avgPayoutPerDeliveredOrder.toFixed(2)}`,
    },
    cancellationRate: {
      value: parseFloat(cancellationRate.toFixed(4)),
      displayPct: `${(cancellationRate * 100).toFixed(1)}%`,
    },
    totalVolumeUndelivered: { value: totalVolumeUndelivered, unit: 'm³' },
    totalPayoutAllRiders: {
      value: parseFloat(totalPayoutAllRiders.toFixed(3)),
      displayINR: `₹${totalPayoutAllRiders.toFixed(2)}`,
    },
    fleetGenuineAttemptRate: {
      value: parseFloat(fleetGenuineAttemptRate.toFixed(4)),
      displayPct: `${(fleetGenuineAttemptRate * 100).toFixed(1)}%`,
    },
    totalCancelledWithAttempt: { value: withAttempt.length },
    totalCancelledWithoutAttempt: { value: withoutAttempt.length },
    avgDistanceEfficiency: {
      value: parseFloat(avgDistanceEfficiency.toFixed(4)),
      displayPct: `${(avgDistanceEfficiency * 100).toFixed(1)}%`,
    },
    fullyDeliveredOrderCount: {
      value: orderPayouts.filter(o => o.orderStatus === 'Delivered').length,
    },
    partiallyDeliveredOrderCount: {
      value: orderPayouts.filter(o => o.orderStatus === 'Partial').length,
    },
    cancelledWithAttemptOrderCount: { value: withAttempt.length },
    cancelledWithoutAttemptOrderCount: { value: withoutAttempt.length },
  };
}

// ─── Formatters ─────────────────────────────────────────────

export function formatCurrency(amount: number, currency = '₹'): string {
  return `${currency}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

export function formatVolume(volumeM3: number): string {
  if (volumeM3 >= 1) return `${volumeM3.toFixed(4)} m³`;
  if (volumeM3 >= 0.001) return `${(volumeM3 * 1000).toFixed(2)} L`;
  return `${(volumeM3 * 1_000_000).toFixed(0)} cm³`;
}
