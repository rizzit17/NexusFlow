// ============================================================
// DS NexusFlow — Excel Parser (workbook structure)
// ============================================================

import * as XLSX from 'xlsx';
import type { OrderPayout, SkuBreakdownRow, OrderStatus } from '@/types/workbook';

export interface ParsedExcelResult {
  orders: OrderPayout[];
  skus: SkuBreakdownRow[];
  errors: string[];
  sheets: string[];
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_\-()]+/g, '');
}

function findColumn(headers: string[], candidates: string[]): string | undefined {
  const normalized = candidates.map(normalizeKey);
  return headers.find(h => normalized.includes(normalizeKey(h)));
}

function parseStatus(raw: string): OrderStatus {
  const s = raw.trim().toLowerCase();
  if (s.includes('cancel')) return 'Cancelled';
  if (s.includes('partial')) return 'Partial';
  return 'Delivered';
}

export function parseSkuSheet(sheet: XLSX.WorkSheet): { skus: Partial<SkuBreakdownRow>[]; errors: string[] } {
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const errors: string[] = [];
  const skus: Partial<SkuBreakdownRow>[] = [];

  if (!json.length) return { skus, errors: ['SKU sheet is empty'] };

  const headers = Object.keys(json[0]);
  const orderCol = findColumn(headers, ['Order ID', 'OrderID', 'order_id']);
  const riderCol = findColumn(headers, ['Rider ID', 'RiderID', 'rider_id']);
  const skuCol = findColumn(headers, ['SKU ID', 'SKUID', 'sku_id']);
  const nameCol = findColumn(headers, ['SKU Name', 'Name', 'sku_name']);
  const catCol = findColumn(headers, ['Category', 'category']);
  const volCol = findColumn(headers, ['Unit Volume', 'Unit Vol', 'unit_volume', 'Volume']);
  const ordCol = findColumn(headers, ['Ordered Qty', 'Ordered', 'ordered_qty']);
  const delCol = findColumn(headers, ['Delivered Qty', 'Delivered', 'delivered_qty']);

  json.forEach((row, i) => {
    if (!orderCol || !skuCol) {
      errors.push(`Row ${i + 2}: Missing Order ID or SKU ID`);
      return;
    }
    const unitVolume = parseFloat(String(row[volCol ?? '']));
    skus.push({
      orderId: String(row[orderCol]),
      riderId: riderCol ? String(row[riderCol]) : '',
      skuId: String(row[skuCol]),
      skuName: nameCol ? String(row[nameCol]) : 'Unknown',
      category: catCol ? String(row[catCol]) : 'General',
      unitVolume: isNaN(unitVolume) ? 0.001 : unitVolume,
      orderedQty: ordCol ? parseInt(String(row[ordCol]), 10) || 0 : 0,
      deliveredQty: delCol ? parseInt(String(row[delCol]), 10) || 0 : 0,
    });
  });

  return { skus, errors };
}

export function parseOrderSheet(sheet: XLSX.WorkSheet): { orders: Partial<OrderPayout>[]; errors: string[] } {
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const errors: string[] = [];
  const orders: Partial<OrderPayout>[] = [];

  if (!json.length) return { orders, errors: ['Order sheet is empty'] };

  const headers = Object.keys(json[0]);
  const idCol = findColumn(headers, ['Order ID', 'OrderID', 'order_id']);
  const riderIdCol = findColumn(headers, ['Rider ID', 'RiderID']);
  const riderNameCol = findColumn(headers, ['Rider Name', 'Rider']);
  const dateCol = findColumn(headers, ['Delivery Date', 'Date', 'delivery_date']);
  const statusCol = findColumn(headers, ['Status', 'Order Status', 'order_status']);
  const payoutCol = findColumn(headers, ['Base Payout', 'base_payout']);
  const driftCol = findColumn(headers, ['Drift', 'Drift KM', 'drift_distance']);
  const plannedCol = findColumn(headers, ['Planned Distance', 'Planned KM', 'planned_distance']);
  const travelledCol = findColumn(headers, ['Travelled Distance', 'Travelled KM', 'travelled_distance']);

  json.forEach((row, i) => {
    if (!idCol) {
      errors.push(`Row ${i + 2}: Missing Order ID`);
      return;
    }
    const status = statusCol ? parseStatus(String(row[statusCol])) : 'Delivered';
    orders.push({
      orderId: String(row[idCol]),
      riderId: riderIdCol ? String(row[riderIdCol]) : 'R-Unknown',
      riderName: riderNameCol ? String(row[riderNameCol]) : 'Unknown',
      deliveryDate: dateCol ? String(row[dateCol]).slice(0, 10) : new Date().toISOString().split('T')[0],
      orderStatus: status,
      basePayout: payoutCol ? parseFloat(String(row[payoutCol])) || 40 : 40,
      driftDistance: driftCol && row[driftCol] !== '' ? parseFloat(String(row[driftCol])) : null,
      plannedDistance: plannedCol ? parseFloat(String(row[plannedCol])) || 0 : 0,
      travelledDistance: travelledCol ? parseFloat(String(row[travelledCol])) || 0 : 0,
      cancellationReason: 'N/A',
      cancelledBy: 'N/A',
      cancellationCategory: 'N/A',
    });
  });

  return { orders, errors };
}

export async function parseExcelFile(file: File): Promise<ParsedExcelResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const result: ParsedExcelResult = {
    orders: [],
    skus: [],
    errors: [],
    sheets: workbook.SheetNames,
  };

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const normalizedName = normalizeKey(sheetName);

    if (normalizedName.includes('sku') || normalizedName.includes('breakdown')) {
      const { skus, errors } = parseSkuSheet(sheet);
      result.skus.push(
        ...(skus.map(s => ({
          ...s,
          missingQty: 0,
          orderedSkuVol: 0,
          deliveredSkuVol: 0,
          volumeContribPct: 0,
          deliveryStatus: '',
          skuFulfillmentPct: 0,
          skuPayoutContribution: 0,
          bulkySkuFlag: null,
          highVolumeSkuFlag: null,
        })) as SkuBreakdownRow[])
      );
      result.errors.push(...errors.map(e => `[${sheetName}] ${e}`));
    } else if (normalizedName.includes('order') || normalizedName.includes('payout')) {
      const { orders, errors } = parseOrderSheet(sheet);
      result.orders.push(
        ...(orders.map(o => ({
          ...o,
          totalOrderVolume: 0,
          totalDeliveredVolume: 0,
          fulfillmentRatio: 0,
          cancellationMultiplier: 1,
          finalOrderPayout: 0,
          distanceEfficiency: 0,
          orderClassification: '',
        })) as OrderPayout[])
      );
      result.errors.push(...errors.map(e => `[${sheetName}] ${e}`));
    }
  }

  return result;
}

export function getSheetPreview(
  file: ArrayBuffer,
  sheetName: string,
  maxRows = 5
): { headers: string[]; rows: Record<string, unknown>[] } {
  const workbook = XLSX.read(file, { type: 'array' });
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { headers: [], rows: [] };
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const headers = json.length ? Object.keys(json[0]) : [];
  return { headers, rows: json.slice(0, maxRows) };
}
