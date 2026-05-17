'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  XCircle, Upload, PenSquare, Settings, Zap
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',                 label: 'Executive Dashboard', icon: LayoutDashboard },
  { href: '/sku-breakdown',    label: 'SKU Breakdown',       icon: Package },
  { href: '/order-payout',     label: 'Order Payout',        icon: ShoppingCart },
  { href: '/rider-summary',    label: 'Rider Summary',        icon: Users },
  { href: '/cancellations',    label: 'Cancellations',        icon: XCircle },
  { href: '/upload',           label: 'Excel Upload',         icon: Upload },
  { href: '/manual-entry',     label: 'Manual Entry',         icon: PenSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 40,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34, height: 34,
            borderRadius: 9,
            background: 'var(--ds-green-800)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Zap size={16} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              DS NexusFlow
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-faint)', fontWeight: 400, lineHeight: 1.3 }}>
              Payout Intelligence
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '12px 12px', flex: 1 }}>
        <div className="section-title" style={{ paddingLeft: 4, marginBottom: 6 }}>Platform</div>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`nav-item ${isActive ? 'active' : ''}`}
              style={{ marginBottom: 2 }}>
              <Icon size={15} className="nav-icon" strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border)',
        fontSize: 11,
        color: 'var(--text-faint)',
      }}>
        <div style={{ fontWeight: 600, marginBottom: 2, color: 'var(--text-muted)' }}>DS Group</div>
        <div>Operations Intelligence v2.0</div>
      </div>
    </aside>
  );
}
