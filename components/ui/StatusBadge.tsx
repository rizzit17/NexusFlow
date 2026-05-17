'use client';

interface StatusBadgeProps {
  status: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  Delivered:  { label: 'Delivered',  className: 'badge badge-delivered' },
  Partial:    { label: 'Partial',    className: 'badge badge-partial' },
  Cancelled:  { label: 'Cancelled',  className: 'badge badge-cancelled' },
  DELIVERED:  { label: 'Delivered',  className: 'badge badge-delivered' },
  PARTIAL:    { label: 'Partial',    className: 'badge badge-partial' },
  CANCELLED:  { label: 'Cancelled',  className: 'badge badge-cancelled' },
  PENDING:    { label: 'Pending',    className: 'badge badge-pending' },
  'Fully Delivered': { label: 'Delivered', className: 'badge badge-delivered' },
  'Partially Delivered': { label: 'Partial', className: 'badge badge-partial' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, className: 'badge badge-pending' };
  return <span className={config.className}>{config.label}</span>;
}

export function DriftBadge({ driftKm }: { driftKm: number }) {
  const tier = driftKm <= 0.1 ? { label: '50% Comp', cls: 'badge-delivered' }
             : driftKm <= 0.5 ? { label: '25% Comp', cls: 'badge-partial' }
             :                  { label: 'No Comp',   cls: 'badge-cancelled' };
  return <span className={`badge ${tier.cls}`}>{tier.label}</span>;
}
