'use client';

import { usePathname } from 'next/navigation';
import { Bell, RefreshCw } from 'lucide-react';
import { GlobalSearch } from '@/components/layout/GlobalSearch';

const PAGE_LABELS: Record<string, string> = {
  '/':              'Executive Dashboard',
  '/sku-breakdown': 'SKU Breakdown',
  '/order-payout':  'Order Payout',
  '/rider-summary': 'Rider Summary',
  '/cancellations': 'Cancellation Intelligence',
  '/upload':        'Excel Upload Center',
  '/manual-entry':  'Manual Entry',
};

export function Topbar() {
  const pathname = usePathname();
  const pageLabel = PAGE_LABELS[pathname] ?? 'Dashboard';

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header style={{
      height: 'var(--topbar-height)',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 30,
      flexShrink: 0,
    }}>
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontSize: 14.5,
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: '-0.01em',
        }}>
          {pageLabel}
        </h1>
      </div>

      <GlobalSearch />

      <button
        type="button"
        onClick={handleRefresh}
        className="btn btn-secondary tooltip"
        data-tooltip="Reload page (keeps your saved data)"
        style={{ padding: '6px 10px' }}
        aria-label="Reload page"
      >
        <RefreshCw size={13} />
      </button>

      <button type="button" className="btn btn-ghost" style={{ padding: '6px 10px', position: 'relative' }} aria-label="Notifications">
        <Bell size={15} />
        <span style={{
          position: 'absolute', top: 5, right: 5,
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--ds-green-700)',
        }} />
      </button>

      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: 'var(--ds-green-800)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11.5, fontWeight: 700, color: 'white', flexShrink: 0,
      }}>
        DS
      </div>
    </header>
  );
}
