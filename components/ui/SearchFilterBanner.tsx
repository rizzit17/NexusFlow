'use client';

import { X } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface SearchFilterBannerProps {
  matchCount: number;
  entityLabel?: string;
}

export function SearchFilterBanner({ matchCount, entityLabel = 'results' }: SearchFilterBannerProps) {
  const globalSearch = useStore(s => s.globalSearch);
  const setGlobalSearch = useStore(s => s.setGlobalSearch);

  if (!globalSearch.trim()) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 14px',
        marginBottom: 16,
        background: 'var(--ds-green-50)',
        border: '1px solid rgba(28,122,82,0.2)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 12.5,
      }}
    >
      <span style={{ color: 'var(--ds-green-900)' }}>
        Showing <strong>{matchCount}</strong> {entityLabel} for &ldquo;<strong>{globalSearch}</strong>&rdquo;
        <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>(all pages filtered)</span>
      </span>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setGlobalSearch('')}
        style={{ padding: '4px 8px', fontSize: 11 }}
      >
        <X size={12} /> Clear
      </button>
    </div>
  );
}
