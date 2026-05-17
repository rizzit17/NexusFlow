// ============================================================
// DS NexusFlow — Load initial workbook (single source of truth)
// ============================================================

import type { NexusGlobalData } from '@/types/workbook';
import workbookJson from '@/data/workbook.json';

export function getInitialWorkbook(): NexusGlobalData {
  const w = workbookJson as NexusGlobalData;
  return {
    config: { ...w.config },
    orderPayouts: w.orderPayouts.map(o => ({ ...o })),
    skuBreakdown: w.skuBreakdown.map(s => ({ ...s })),
    riderSummary: w.riderSummary.map(r => ({ ...r })),
    fleetTotals: { ...w.fleetTotals },
    operationalKPIs: JSON.parse(JSON.stringify(w.operationalKPIs)),
  };
}
