// ============================================================
// DS NexusFlow — Locus Export Parser (Task Details + Item Details)
// Parses the exact column layout of the company's Locus workbook.
// Only "Task Details" and "Item Details" sheets are consumed.
// ============================================================

import * as XLSX from 'xlsx';
import type { OrderPayout, SkuBreakdownRow } from '@/types/workbook';
import type { HubConfig } from '@/types/workbook';
import { enrichSku } from './skuRegistry';

export interface ParsedCompanyWorkbookResult {
  orders: OrderPayout[];
  skus: SkuBreakdownRow[];
  errors: string[];
  sheets: string[];
}

// ─── Helpers ────────────────────────────────────────────────

/** Strip BOM and whitespace from any cell value */
function clean(raw: unknown): string {
  return String(raw ?? '').replace(/^\uFEFF/, '').trim();
}

/** Parse a numeric cell, returning 0 if absent/NaN */
function num(raw: unknown): number {
  const n = parseFloat(String(raw ?? ''));
  return isNaN(n) ? 0 : n;
}

/**
 * Parse LINE ITEMS string: "3 / 4 DROP" → { delivered: 3, total: 4 }
 * Also handles "3 / 3 DROP", "0 / 2 DROP", etc.
 */
function parseLineItems(raw: unknown): { delivered: number; total: number } {
  if (!raw) return { delivered: 0, total: 0 };
  const s = String(raw).replace(/DROP/gi, '').trim();
  if (!s.includes('/')) return { delivered: 0, total: 0 };
  const parts = s.split('/').map(p => parseInt(p.trim(), 10));
  return {
    delivered: isNaN(parts[0]) ? 0 : parts[0],
    total: isNaN(parts[1]) ? 0 : parts[1],
  };
}

/**
 * Extract just the date part from a Locus datetime string.
 * "13/05/2026 12:19 PM" → "13/05/2026"
 * "13/05/2026"          → "13/05/2026"
 * blank / null           → null
 */
function parseDate(raw: unknown): string | null {
  const s = clean(raw);
  if (!s) return null;
  return s.split(' ')[0].trim(); // take everything before the first space
}

// ─── Main export ─────────────────────────────────────────────

/**
 * Parse a Locus workbook export into orders + SKUs.
 *
 * @param file       The uploaded .xlsx File object
 * @param hubConfigs Array of HubConfig entries from global state,
 *                   used to resolve driftThreshold and baseOrderPayout per hub.
 */
export async function parseCompanyWorkbook(
  file: File,
  hubConfigs: HubConfig[] = []
): Promise<ParsedCompanyWorkbookResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  const result: ParsedCompanyWorkbookResult = {
    orders: [],
    skus: [],
    errors: [],
    sheets: wb.SheetNames,
  };

  // ── STEP 1: Locate the two sheets by exact name ────────────
  const taskSheet = wb.Sheets['Task Details'];
  const itemSheet = wb.Sheets['Item Details'];

  if (!taskSheet) {
    result.errors.push('Required sheet "Task Details" not found in workbook.');
    return result;
  }
  if (!itemSheet) {
    result.errors.push('Required sheet "Item Details" not found in workbook.');
    return result;
  }

  // ── STEP 2: Build SKU map from Item Details (DROP rows only) ─
  // Columns (0-based): 0=TASK ID, 2=VISIT TYPE, 3=ITEM ID, 4=ITEM DESCRIPTION,
  //                    5=QUANTITY BOOKED, 6=QUANTITY TRANSACTED, 7=TRANSACTION STATUS
  const itemRows = XLSX.utils.sheet_to_json<unknown[]>(itemSheet, {
    header: 1,
    defval: null,
  });

  // Build a quick lookup: taskId → SkuBreakdownRow[]
  // We defer orderId/riderId linkage until we process Task Details.
  const skuMap = new Map<string, Array<{
    skuId: string;
    skuName: string;
    orderedQty: number;
    deliveredQty: number;
    transactionStatus: string;
  }>>();

  for (let i = 1; i < itemRows.length; i++) {  // skip header row 0
    const row = itemRows[i] as unknown[];
    if (!row) continue;

    const visitType = clean(row[2]);
    if (visitType !== 'DROP') continue;           // ← CRITICAL: ignore HOMEBASE rows

    const taskId = clean(row[0]);
    if (!taskId) continue;

    if (!skuMap.has(taskId)) skuMap.set(taskId, []);
    skuMap.get(taskId)!.push({
      skuId: clean(row[3]),
      skuName: clean(row[4]),
      orderedQty: parseInt(String(row[5] ?? ''), 10) || 0,
      deliveredQty: parseInt(String(row[6] ?? ''), 10) || 0,
      transactionStatus: clean(row[7]),
    });
  }

  // ── STEP 3: Parse Task Details rows ──────────────────────────
  // Columns (0-based):
  //  0  → TASK ID
  //  2  → VISIT STATUS  ("COMPLETED" | "CANCELLED")
  //  4  → RIDER NAME
  // 11  → VOLUME (m³)
  // 13  → DRIFT (CANCELLED, KMS)
  // 16  → CANCELLED BY
  // 19  → HOMEBASE LOCATION ID  (hubId)
  // 21  → RIDER ID
  // 23  → DELIVERY DATE
  // 26  → CANCELLED AT  (fallback date)
  // 27  → LINE ITEMS  ("X / Y DROP")
  // 33  → OTP
  // 38  → CANCELLATION REASON  (index 38, NOT 39 or 40)

  const taskRows = XLSX.utils.sheet_to_json<unknown[]>(taskSheet, {
    header: 1,
    defval: null,
  });

  for (let i = 1; i < taskRows.length; i++) {   // skip header row 0
    const row = taskRows[i] as unknown[];
    if (!row) continue;

    // Strip BOM on every row (spec says first row only, but harmless everywhere)
    const orderId = clean(row[0]);
    if (!orderId || orderId === 'TASK ID') continue;

    const visitStatus  = clean(row[2]);   // "COMPLETED" or "CANCELLED"
    const riderNameRaw = clean(row[4]);
    const volume       = num(row[11]);
    const driftKms     = num(row[13]);
    const cancelledBy  = clean(row[16]);
    const hubId        = clean(row[19]);
    const riderIdRaw   = clean(row[21]);
    const delivDateRaw = clean(row[23]);
    const cancelledAt  = clean(row[26]);
    const lineItemsRaw = row[27];
    const otpValue     = clean(row[33]);
    const cancReason   = clean(row[38]);

    // ── Date resolution ───────────────────────────────────────
    const deliveryDate =
      delivDateRaw || parseDate(cancelledAt) || new Date().toISOString().split('T')[0];

    // ── Line items & fulfillment ──────────────────────────────
    const { delivered, total } = parseLineItems(lineItemsRaw);
    const fulfillmentRatio = total > 0 ? delivered / total : 0;
    const deliveredVolume  = volume * fulfillmentRatio;

    // ── Hub lookup (drift threshold + base payout) ────────────
    const hub = hubConfigs.find(h => h.hubId === hubId);
    const driftThreshold = hub?.driftThreshold ?? 0.5;   // default 0.5 km per spec
    const basePayout     = hub?.baseOrderPayout ?? 40;   // default ₹40

    // ── Classify order and compute payout ────────────────────
    let orderStatus: 'Delivered' | 'Partial' | 'Cancelled';
    let cancellationMultiplier: number;
    let finalOrderPayout: number;
    let orderClassification: string;
    let resolvedRiderId   = riderIdRaw;
    let resolvedRiderName = riderNameRaw;

    if (visitStatus === 'COMPLETED') {
      orderStatus             = fulfillmentRatio >= 1 ? 'Delivered' : 'Partial';
      cancellationMultiplier  = 1;
      finalOrderPayout        = basePayout * fulfillmentRatio;
      orderClassification     = fulfillmentRatio >= 1 ? 'Fully Delivered' : 'Partially Delivered';

    } else if (visitStatus === 'CANCELLED') {
      orderStatus = 'Cancelled';

      if (cancelledBy.startsWith('Dashboard -')) {
        // Ops-team / dashboard cancellation — no rider, no payout, skip drift logic
        cancellationMultiplier  = 0;
        finalOrderPayout        = 0;
        orderClassification     = 'Cancelled – No Payout';
        resolvedRiderId         = '';
        resolvedRiderName       = '';
      } else {
        // Rider-initiated cancellation — binary drift threshold
        if (driftKms <= driftThreshold) {
          cancellationMultiplier = 1;
          finalOrderPayout       = basePayout;   // full base payout within threshold
          orderClassification    = 'Cancelled – Compensated';
        } else {
          cancellationMultiplier = 0;
          finalOrderPayout       = 0;
          orderClassification    = 'Cancelled – No Payout';
        }
      }
    } else {
      // Unexpected visitStatus — treat as delivered and flag
      orderStatus            = 'Delivered';
      cancellationMultiplier = 1;
      finalOrderPayout       = basePayout * fulfillmentRatio;
      orderClassification    = 'Fully Delivered';
      result.errors.push(`Row ${i + 1}: Unknown VISIT STATUS "${visitStatus}" for order ${orderId}`);
    }

    // ── Build OrderPayout record ──────────────────────────────
    const order: OrderPayout = {
      orderId,
      hubId:                 hubId || undefined,
      riderId:               resolvedRiderId,
      riderName:             resolvedRiderName,
      deliveryDate,
      orderStatus,
      basePayout,
      totalOrderVolume:      volume,
      totalDeliveredVolume:  deliveredVolume,
      fulfillmentRatio,
      driftDistance:         visitStatus === 'CANCELLED' ? driftKms : null,
      cancellationMultiplier,
      finalOrderPayout:      parseFloat(finalOrderPayout.toFixed(3)),
      cancellationReason:    cancReason || 'N/A',
      cancelledBy:           cancelledBy || 'N/A',
      cancellationCategory:  'N/A',
      otpAttempted:          otpValue ? 'Yes' : 'No',
      visitStatus:           visitStatus,
      plannedDistance:       0,
      travelledDistance:     0,
      distanceEfficiency:    0,
      orderClassification,
    };

    result.orders.push(order);

    // ── Build SkuBreakdownRow records for this order ──────────
    const rawSkus = skuMap.get(orderId) ?? [];
    for (const sku of rawSkus) {
      const enrichment = enrichSku(sku.skuName);
      const orderedSkuVol   = enrichment.unitVolume * sku.orderedQty;
      const deliveredSkuVol = enrichment.unitVolume * sku.deliveredQty;

      result.skus.push({
        orderId,
        riderId:             resolvedRiderId,
        skuId:               sku.skuId,
        skuName:             sku.skuName,
        category:            enrichment.category,
        unitVolume:          enrichment.unitVolume,
        orderedQty:          sku.orderedQty,
        deliveredQty:        sku.deliveredQty,
        missingQty:          sku.orderedQty - sku.deliveredQty,
        orderedSkuVol,
        deliveredSkuVol,
        volumeContribPct:    0,   // recalculated by workbookEngine after import
        deliveryStatus:      sku.transactionStatus,
        skuFulfillmentPct:   sku.orderedQty > 0 ? sku.deliveredQty / sku.orderedQty : 0,
        skuPayoutContribution: 0, // recalculated by workbookEngine after import
        bulkySkuFlag:        enrichment.bulkyFlag ? 'BULKY' : null,
        highVolumeSkuFlag:   null,
      });
    }
  }

  return result;
}
