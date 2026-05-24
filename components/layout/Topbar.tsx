'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, RefreshCw, Package, FileSpreadsheet, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { useStore } from '@/store/useStore';
import type { AppNotification, NotificationType } from '@/store/useStore';

const PAGE_LABELS: Record<string, string> = {
  '/dashboard':     'Executive Dashboard',
  '/sku-breakdown': 'SKU Breakdown',
  '/order-payout':  'Order Payout',
  '/rider-summary': 'Rider Summary',
  '/cancellations': 'Cancellation Intelligence',
  '/upload':        'Excel Upload Center',
  '/manual-entry':  'Manual Entry',
};

// ─── Timestamp formatter ────────────────────────────────────────
function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} min ago`;
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const timeStr = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (sameDay) return timeStr;
  const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${dateStr}, ${timeStr}`;
}

// ─── Icon per notification type ─────────────────────────────────
function NotifIcon({ type }: { type: NotificationType }) {
  const style: React.CSSProperties = { flexShrink: 0, marginTop: 1 };
  switch (type) {
    case 'order_added':   return <Package       size={14} style={{ ...style, color: '#2563EB' }} />;
    case 'excel_upload':  return <FileSpreadsheet size={14} style={{ ...style, color: '#2563EB' }} />;
    case 'compensated':   return <CheckCircle    size={14} style={{ ...style, color: 'var(--ds-green-700)' }} />;
    case 'no_payout':     return <XCircle        size={14} style={{ ...style, color: '#DC2626' }} />;
  }
}

// ─── Individual notification row ────────────────────────────────
function NotifRow({ n, isLast }: { n: AppNotification; isLast: boolean }) {
  return (
    <div style={{
      padding: '10px 14px',
      borderBottom: isLast ? 'none' : '0.5px solid var(--border)',
      background: n.read ? 'transparent' : 'var(--bg-default, rgba(0,0,0,0.025))',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <NotifIcon type={n.type} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {n.title}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
              {formatTimestamp(n.timestamp)}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, lineHeight: 1.4 }}>
            {n.body}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Topbar() {
  const pathname  = usePathname();
  const router     = useRouter();
  const pageLabel  = PAGE_LABELS[pathname] ?? 'Dashboard';

  const notifications  = useStore(s => s.notifications);
  const markAllRead    = useStore(s => s.markAllRead);
  const clearNotifications = useStore(s => s.clearNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const [panelOpen, setPanelOpen] = useState(false);
  const bellRef  = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current  && !panelRef.current.contains(e.target as Node) &&
        bellRef.current   && !bellRef.current.contains(e.target as Node)
      ) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen]);

  const togglePanel = useCallback(() => {
    setPanelOpen(prev => {
      const next = !prev;
      if (next && unreadCount > 0) markAllRead();
      return next;
    });
  }, [unreadCount, markAllRead]);

  const handleRefresh = () => window.location.reload();

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

      <button
        type="button"
        className="btn btn-ghost tooltip"
        data-tooltip="How it works"
        style={{ padding: '6px 10px' }}
        aria-label="How it works"
        onClick={() => router.push('/')}
      >
        <HelpCircle size={15} />
      </button>

      {/* ── Bell button + notification panel ── */}
      <div style={{ position: 'relative' }}>
        <button
          ref={bellRef}
          type="button"
          className="btn btn-ghost"
          style={{ padding: '6px 10px', position: 'relative' }}
          aria-label="Notifications"
          onClick={togglePanel}
        >
          <Bell size={15} />

          {/* Badge — only rendered when there are unread notifications */}
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: 4,
              right: 4,
              minWidth: 14,
              height: 14,
              borderRadius: 7,
              background: 'var(--ds-green-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 700,
              color: 'white',
              lineHeight: 1,
              padding: '0 2px',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* ── Notification panel dropdown ── */}
        {panelOpen && (
          <div
            ref={panelRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 340,
              maxHeight: 420,
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg, 10px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              zIndex: 200,
            }}
          >
            {/* Panel header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: '0.5px solid var(--border)',
              position: 'sticky',
              top: 0,
              background: 'var(--bg-surface)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Notifications</span>
              {notifications.length > 0 && (
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 11, padding: '2px 6px', color: 'var(--text-muted)' }}
                  onClick={() => clearNotifications()}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Empty state */}
            {notifications.length === 0 ? (
              <div style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}>
                No notifications yet
              </div>
            ) : (
              notifications.map((n, i) => (
                <NotifRow key={n.id} n={n} isLast={i === notifications.length - 1} />
              ))
            )}
          </div>
        )}
      </div>

      {/* DS Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: 'var(--ds-green-800)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        padding: 5,
      }}>
        <svg viewBox="0 0 100 100" width={16} height={16} style={{ display: 'block' }}>
          <g fill="white">
            {/* Left Stem of D with S-curve cut */}
            <path d="M22 20 H45 C38 31, 31 40, 31 50 C31 60, 38 69, 45 80 H22 Z" />
            {/* Right Arch of D with S-curve cut */}
            <path d="M53 20 C68 20, 78 33, 78 50 C78 67, 68 80, 53 80 C46 69, 39 60, 39 50 C39 40, 46 31, 53 20 Z" />
          </g>
        </svg>
      </div>
    </header>
  );
}
