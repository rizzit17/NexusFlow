'use client';

import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import {
  buildSearchContext,
  filterOrderPayouts,
  filterSkuBreakdown,
  filterRiderSummary,
} from '@/lib/search';

export function useSearchFilter() {
  const globalSearch = useStore(s => s.globalSearch);
  const orderPayouts = useStore(s => s.orderPayouts);
  const skuBreakdown = useStore(s => s.skuBreakdown);
  const riderSummary = useStore(s => s.riderSummary);

  const ctx = useMemo(
    () => buildSearchContext(globalSearch, orderPayouts, skuBreakdown, riderSummary),
    [globalSearch, orderPayouts, skuBreakdown, riderSummary]
  );

  const filteredOrders = useMemo(
    () => filterOrderPayouts(orderPayouts, ctx),
    [orderPayouts, ctx]
  );

  const filteredSkus = useMemo(
    () => filterSkuBreakdown(skuBreakdown, ctx),
    [skuBreakdown, ctx]
  );

  const filteredRiders = useMemo(
    () => filterRiderSummary(riderSummary, ctx),
    [riderSummary, ctx]
  );

  return {
    globalSearch,
    isSearchActive: ctx.active,
    matchCount: ctx.active ? ctx.orderIds.size : orderPayouts.length,
    filteredOrders,
    filteredSkus,
    filteredRiders,
    ctx,
  };
}
