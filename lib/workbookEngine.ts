// ============================================================
// DS NexusFlow — Full workbook recalculation pipeline
// SKU Breakdown → Order Payout → Rider Summary → Fleet KPIs
// ============================================================

import type {
  NexusGlobalData,
  OrderPayout,
  SkuBreakdownRow,
  WorkbookConfig,
} from '@/types/workbook';
import {
  calcMissingQty,
  calcOrderedSkuVol,
  calcDeliveredSkuVol,
  calcSkuDeliveryStatus,
  calcSkuFulfillmentPct,
  calcBulkySkuFlag,
  calcHighVolumeSkuFlag,
  calcVolumeContribPct,
  calcSkuPayoutContribution,
  calcTotalOrderVolumeFromSkus,
  calcTotalDeliveredVolumeFromSkus,
  calcFulfillmentRatio,
  calcCancellationMultiplier,
  calcFinalOrderPayout,
  calcDistanceEfficiency,
  calcOrderClassification,
  calcRiderSummaries,
  calcFleetTotals,
  calcOperationalKPIs,
} from './calculations';

export function recalculateSkuRow(
  sku: SkuBreakdownRow,
  orderDeliveredVol: number,
  config: WorkbookConfig
): SkuBreakdownRow {
  const orderedSkuVol = calcOrderedSkuVol(sku.unitVolume, sku.orderedQty);
  const deliveredSkuVol = calcDeliveredSkuVol(sku.unitVolume, sku.deliveredQty);
  return {
    ...sku,
    missingQty: calcMissingQty(sku.orderedQty, sku.deliveredQty),
    orderedSkuVol,
    deliveredSkuVol,
    deliveryStatus: calcSkuDeliveryStatus(sku.deliveredQty, sku.orderedQty),
    skuFulfillmentPct: calcSkuFulfillmentPct(sku.deliveredQty, sku.orderedQty),
    bulkySkuFlag: calcBulkySkuFlag(sku.unitVolume, config),
    highVolumeSkuFlag: calcHighVolumeSkuFlag(orderedSkuVol, config),
    volumeContribPct: calcVolumeContribPct(deliveredSkuVol, orderDeliveredVol),
    skuPayoutContribution: calcSkuPayoutContribution(
      deliveredSkuVol,
      orderDeliveredVol,
      config
    ),
  };
}

export function recalculateSkuBreakdown(
  skuBreakdown: SkuBreakdownRow[],
  config: WorkbookConfig
): SkuBreakdownRow[] {
  const orderIds = [...new Set(skuBreakdown.map(s => s.orderId))];
  const orderDeliveredVols = new Map<string, number>();
  orderIds.forEach(orderId => {
    orderDeliveredVols.set(
      orderId,
      skuBreakdown
        .filter(s => s.orderId === orderId)
        .reduce((sum, s) => sum + calcDeliveredSkuVol(s.unitVolume, s.deliveredQty), 0)
    );
  });

  return skuBreakdown.map(sku =>
    recalculateSkuRow(sku, orderDeliveredVols.get(sku.orderId) ?? 0, config)
  );
}

export function recalculateOrderPayout(
  order: OrderPayout,
  skuBreakdown: SkuBreakdownRow[],
  config: WorkbookConfig
): OrderPayout {
  // Find hub by the order's hubId. If not found (e.g. hub deleted), fall back to
  // a safe default threshold (0.5 km per spec) and use the stored basePayout.
  const hub = order.hubId ? config.hubs?.find(h => h.hubId === order.hubId) : undefined;
  const hubThreshold = hub ? hub.driftThreshold : 0.5;
  const basePayout = hub ? hub.baseOrderPayout : order.basePayout;

  const totalOrderVolume = calcTotalOrderVolumeFromSkus(skuBreakdown, order.orderId);
  const totalDeliveredVolume = calcTotalDeliveredVolumeFromSkus(skuBreakdown, order.orderId);
  const fulfillmentRatio = calcFulfillmentRatio(
    order.orderStatus,
    totalDeliveredVolume,
    totalOrderVolume
  );
  const cancellationMultiplier = calcCancellationMultiplier(
    order.orderStatus,
    order.driftDistance,
    hubThreshold
  );
  const finalOrderPayout = calcFinalOrderPayout(
    order.orderStatus,
    basePayout,
    fulfillmentRatio,
    cancellationMultiplier
  );

  return {
    ...order,
    totalOrderVolume,
    totalDeliveredVolume,
    fulfillmentRatio,
    cancellationMultiplier,
    finalOrderPayout,
    distanceEfficiency: calcDistanceEfficiency(order.plannedDistance, order.travelledDistance),
    orderClassification: calcOrderClassification(order.orderStatus, cancellationMultiplier),
  };
}

export function recalculateWorkbook(state: NexusGlobalData): NexusGlobalData {
  const config = state.config;
  let skuBreakdown = recalculateSkuBreakdown(state.skuBreakdown, config);

  // Second pass: SKU payout contribution needs final order delivered volumes
  const orderIds = [...new Set(skuBreakdown.map(s => s.orderId))];
  orderIds.forEach(orderId => {
    const orderDeliveredVol = skuBreakdown
      .filter(s => s.orderId === orderId)
      .reduce((sum, s) => sum + s.deliveredSkuVol, 0);
    skuBreakdown = skuBreakdown.map(sku =>
      sku.orderId === orderId
        ? recalculateSkuRow(sku, orderDeliveredVol, config)
        : sku
    );
  });

  const orderPayouts = state.orderPayouts.map(o =>
    recalculateOrderPayout(o, skuBreakdown, config)
  );
  const riderSummary = calcRiderSummaries(orderPayouts, config);
  const fleetTotals = calcFleetTotals(orderPayouts, riderSummary, config);
  const operationalKPIs = calcOperationalKPIs(orderPayouts, riderSummary);

  return {
    config,
    orderPayouts,
    skuBreakdown,
    riderSummary,
    fleetTotals,
    operationalKPIs,
  };
}
