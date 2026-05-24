'use client';

import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  badge?: string;
}

export function PageHeader({ title, description, actions, badge }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 24,
      gap: 16,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h2 style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            {title}
          </h2>
          {badge && (
            <span style={{
              fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em',
              background: 'var(--ds-green-50)', color: 'var(--ds-green-800)',
              border: '1px solid var(--ds-green-100)',
              padding: '2px 8px', borderRadius: 99,
              textTransform: 'uppercase',
            }}>
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: 0 }}>{description}</p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>
      )}
    </div>
  );
}
