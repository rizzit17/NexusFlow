// ============================================================
// DS NexusFlow — Zustand Global Store (Workbook v2)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NexusGlobalData, OrderPayout, SkuBreakdownRow, WorkbookConfig } from '@/types/workbook';
import { getInitialWorkbook } from '@/lib/workbookLoad';
import { recalculateWorkbook } from '@/lib/workbookEngine';

interface NexusStore extends NexusGlobalData {
  isHydrated: boolean;
  globalSearch: string;
  setHydrated: () => void;
  setGlobalSearch: (query: string) => void;
  updateConfig: (updates: Partial<WorkbookConfig>) => void;
  setWorkbook: (data: NexusGlobalData) => void;
  addOrderPayout: (order: OrderPayout, skus: SkuBreakdownRow[]) => void;
  updateOrderPayout: (orderId: string, order: Partial<OrderPayout>, skus?: SkuBreakdownRow[]) => void;
  deleteOrderPayout: (orderId: string) => void;
  importOrderPayouts: (orders: OrderPayout[], skus: SkuBreakdownRow[]) => void;
  /** Restore factory workbook — only for admin/debug, not exposed in UI */
  resetToWorkbook: () => void;
}

function applyRecalc(state: NexusGlobalData): NexusGlobalData {
  return recalculateWorkbook(state);
}

const initial = getInitialWorkbook();

type PersistedSlice = Pick<NexusGlobalData, 'config' | 'orderPayouts' | 'skuBreakdown'>;

export const useStore = create<NexusStore>()(
  persist(
    (set) => ({
      ...initial,
      isHydrated: false,
      globalSearch: '',

      setHydrated: () => set({ isHydrated: true }),

      setGlobalSearch: (query) => set({ globalSearch: query }),

      updateConfig: (updates) =>
        set(state => applyRecalc({ ...state, config: { ...state.config, ...updates } })),

      setWorkbook: (data) => set(() => applyRecalc(data)),

      addOrderPayout: (order, skus) =>
        set(state => {
          const next = {
            ...state,
            orderPayouts: [...state.orderPayouts, order],
            skuBreakdown: [...state.skuBreakdown, ...skus],
          };
          return applyRecalc(next);
        }),

      updateOrderPayout: (orderId, updates, skus) =>
        set(state => {
          const next = {
            ...state,
            orderPayouts: state.orderPayouts.map(o =>
              o.orderId === orderId ? { ...o, ...updates } : o
            ),
            skuBreakdown: skus
              ? [
                  ...state.skuBreakdown.filter(s => s.orderId !== orderId),
                  ...skus,
                ]
              : state.skuBreakdown,
          };
          return applyRecalc(next);
        }),

      deleteOrderPayout: (orderId) =>
        set(state => {
          const next = {
            ...state,
            orderPayouts: state.orderPayouts.filter(o => o.orderId !== orderId),
            skuBreakdown: state.skuBreakdown.filter(s => s.orderId !== orderId),
          };
          return applyRecalc(next);
        }),

      importOrderPayouts: (orders, skus) =>
        set(state => {
          const existingOrderIds = new Set(state.orderPayouts.map(o => o.orderId));
          const newOrders = orders.filter(o => !existingOrderIds.has(o.orderId));
          const existingSkuKeys = new Set(
            state.skuBreakdown.map(s => `${s.orderId}:${s.skuId}`)
          );
          const newSkus = skus.filter(
            s => !existingSkuKeys.has(`${s.orderId}:${s.skuId}`)
          );
          const next = {
            ...state,
            orderPayouts: [...state.orderPayouts, ...newOrders],
            skuBreakdown: [...state.skuBreakdown, ...newSkus],
          };
          return applyRecalc(next);
        }),

      resetToWorkbook: () =>
        set({ ...applyRecalc(getInitialWorkbook()), isHydrated: true, globalSearch: '' }),
    }),
    {
      name: 'nexusflow-workbook-v2',
      partialize: (state): PersistedSlice => ({
        config: state.config,
        orderPayouts: state.orderPayouts,
        skuBreakdown: state.skuBreakdown,
      }),
      merge: (persisted, current) => {
        const saved = persisted as PersistedSlice | undefined;
        if (!saved?.orderPayouts?.length) {
          return current;
        }
        const recalced = applyRecalc({
          ...current,
          config: saved.config ?? current.config,
          orderPayouts: saved.orderPayouts,
          skuBreakdown: saved.skuBreakdown,
        });
        return { ...current, ...recalced };
      },
      onRehydrateStorage: () => state => {
        if (state) {
          const recalced = applyRecalc(state);
          useStore.setState({ ...recalced, isHydrated: true });
        }
      },
    }
  )
);

// ─── Selectors ────────────────────────────────────────────────

export function useFleetTotals() {
  return useStore(s => s.fleetTotals);
}

export function useOperationalKPIs() {
  return useStore(s => s.operationalKPIs);
}

export function useRiderSummaries() {
  return useStore(s => s.riderSummary);
}

export function useAnalyticsSnapshot() {
  const fleet = useStore(s => s.fleetTotals);
  const skuBreakdown = useStore(s => s.skuBreakdown);
  const ops = useStore(s => s.operationalKPIs);
  const riderSummary = useStore(s => s.riderSummary);

  return {
    totalOrders: fleet.totalOrders,
    uniqueRiders: riderSummary.length,
    totalPayout: fleet.totalOrderPayout,
    totalDeliveredVolume: fleet.totalDeliveredVolume,
    avgFulfillment: fleet.avgFulfillmentRatio,
    cancellationComp: fleet.cancellationCompensation,
    bulkySkuCount: skuBreakdown.filter(s => s.bulkySkuFlag === 'BULKY').length,
    deliveredCount: fleet.fullyDelivered,
    partialCount: fleet.partialOrders,
    cancelledCount: fleet.cancelledOrders,
    dailyPayout: fleet.dailyPayout,
    weeklyPayout: fleet.weeklyPayout,
    monthlyPayout: fleet.monthlyPayout,
    fleetFulfillmentRate: ops.overallFleetFulfillmentRate.value,
    cancellationRate: ops.cancellationRate.value,
  };
}
