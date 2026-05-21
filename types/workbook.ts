// ============================================================
// DS NexusFlow — Workbook Type Definitions (Excel v2)
// ============================================================

export type OrderStatus = 'Delivered' | 'Partial' | 'Cancelled';

export interface HubConfig {
  hubId: string;
  hubName: string;
  driftThreshold: number;
  baseOrderPayout: number;
}

export interface WorkbookConfig {
  basePayoutPerOrder: number;
  hubs: HubConfig[];
  referenceDate: string;
  workingDaysPerWeek: number;
  workingDaysPerMonth: number;
  bulkySkuUnitVolThreshold: number;
  highVolOrderedVolThreshold: number;
  currency?: string;
}

export interface OrderPayout {
  orderId: string;
  hubId?: string;
  riderId: string;
  riderName: string;
  deliveryDate: string;
  orderStatus: OrderStatus;
  basePayout: number;
  totalOrderVolume: number;
  totalDeliveredVolume: number;
  fulfillmentRatio: number;
  driftDistance: number | null;
  cancellationMultiplier: number;
  finalOrderPayout: number;
  cancellationReason: string;
  cancelledBy: string;
  cancellationCategory: string;
  otpAttempted?: string;
  visitStatus?: string;
  customerContacted?: string;
  proofOfAttempt?: string;
  plannedDistance: number;
  travelledDistance: number;
  distanceEfficiency: number;
  orderClassification: string;
  operationalData?: Record<string, any>;
}

export interface SkuBreakdownRow {
  orderId: string;
  riderId: string;
  skuId: string;
  skuName: string;
  category: string;
  unitVolume: number;
  orderedQty: number;
  deliveredQty: number;
  missingQty: number;
  orderedSkuVol: number;
  deliveredSkuVol: number;
  volumeContribPct: number;
  deliveryStatus: string;
  skuFulfillmentPct: number;
  skuPayoutContribution: number;
  bulkySkuFlag: string | null;
  highVolumeSkuFlag: string | null;
}

export interface RiderSummaryRow {
  riderId: string;
  riderName: string;
  totalOrders: number;
  fullyDelivered: number;
  partialOrders: number;
  cancelledOrders: number;
  totalDeliveredVolume: number;
  avgFulfillmentRatio: number;
  cancellationCompensation: number;
  totalOrderPayout: number;
  dailyPayout: number;
  weeklyPayout: number;
  monthlyPayout: number;
  genuineDeliveryAttempts: number;
  failedAttempts: number;
  cancellationCompCount: number;
}

export interface FleetTotals {
  totalOrders: number;
  fullyDelivered: number;
  partialOrders: number;
  cancelledOrders: number;
  totalDeliveredVolume: number;
  avgFulfillmentRatio: number;
  cancellationCompensation: number;
  totalOrderPayout: number;
  dailyPayout: number;
  weeklyPayout: number;
  monthlyPayout: number;
  genuineDeliveryAttempts: number;
  failedAttempts: number;
  cancellationCompCount: number;
}

export interface OperationalKPIs {
  overallFleetFulfillmentRate: { value: number; displayPct: string };
  avgPayoutPerDeliveredOrder: { value: number; displayINR: string };
  cancellationRate: { value: number; displayPct: string };
  totalVolumeUndelivered: { value: number; unit: string };
  totalPayoutAllRiders: { value: number; displayINR: string };
  fleetGenuineAttemptRate: { value: number; displayPct: string };
  totalCancelledWithAttempt: { value: number };
  totalCancelledWithoutAttempt: { value: number };
  avgDistanceEfficiency: { value: number; displayPct: string };
  fullyDeliveredOrderCount: { value: number };
  partiallyDeliveredOrderCount: { value: number };
  cancelledWithAttemptOrderCount: { value: number };
  cancelledWithoutAttemptOrderCount: { value: number };
}

export interface WorkbookData {
  meta?: Record<string, unknown>;
  config: WorkbookConfig;
  orderPayouts: OrderPayout[];
  skuBreakdown: SkuBreakdownRow[];
  riderSummary: RiderSummaryRow[];
  orderPayoutTotals?: Record<string, number>;
  fleetTotals: FleetTotals;
  operationalKPIs: OperationalKPIs;
}

export interface NexusGlobalData {
  config: WorkbookConfig;
  orderPayouts: OrderPayout[];
  skuBreakdown: SkuBreakdownRow[];
  riderSummary: RiderSummaryRow[];
  fleetTotals: FleetTotals;
  operationalKPIs: OperationalKPIs;
}
