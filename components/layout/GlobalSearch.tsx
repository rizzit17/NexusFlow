'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Package, ShoppingCart, Users } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { buildSearchResults } from '@/lib/search';

const TYPE_ICON = {
  order: ShoppingCart,
  sku: Package,
  rider: Users,
};

export function GlobalSearch() {
  const router = useRouter();
  const globalSearch = useStore(s => s.globalSearch);
  const setGlobalSearch = useStore(s => s.setGlobalSearch);
  const orderPayouts = useStore(s => s.orderPayouts);
  const skuBreakdown = useStore(s => s.skuBreakdown);
  const riderSummary = useStore(s => s.riderSummary);

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = buildSearchResults(
    globalSearch,
    orderPayouts,
    skuBreakdown,
    riderSummary
  );

  useEffect(() => {
    setHighlight(0);
    setOpen(globalSearch.trim().length > 0);
  }, [globalSearch]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const goTo = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setGlobalSearch('');
      return;
    }
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(h => (h + 1) % results.length);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => (h - 1 + results.length) % results.length);
    }
    if (e.key === 'Enter' && results[highlight]) {
      e.preventDefault();
      goTo(results[highlight].href);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: 260 }}>
      <Search
        size={13}
        style={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-faint)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <input
        type="search"
        placeholder="Search orders, SKUs, riders…"
        value={globalSearch}
        onChange={e => setGlobalSearch(e.target.value)}
        onFocus={() => globalSearch.trim() && setOpen(true)}
        onKeyDown={onKeyDown}
        className="input"
        style={{ paddingLeft: 30, paddingRight: globalSearch ? 30 : 12, fontSize: 12.5, width: '100%' }}
        aria-label="Global search"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {globalSearch && (
        <button
          type="button"
          onClick={() => { setGlobalSearch(''); setOpen(false); }}
          className="btn btn-ghost"
          style={{
            position: 'absolute',
            right: 4,
            top: '50%',
            transform: 'translateY(-50%)',
            padding: 4,
          }}
          aria-label="Clear search"
        >
          <X size={12} />
        </button>
      )}

      {open && globalSearch.trim() && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 100,
            maxHeight: 320,
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: '14px 16px', fontSize: 12.5, color: 'var(--text-muted)' }}>
              No matches for &ldquo;{globalSearch}&rdquo;
            </div>
          ) : (
            <>
              <div style={{ padding: '8px 12px', fontSize: 10.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {results.length} result{results.length !== 1 ? 's' : ''} · filters all pages
              </div>
              {results.map((item, i) => {
                const Icon = TYPE_ICON[item.type];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(item.href)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      border: 'none',
                      background: i === highlight ? 'var(--ds-green-50)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <Icon size={14} color="var(--ds-green-800)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.sub}</div>
                    </div>
                    <span className="badge badge-pending" style={{ fontSize: 10, textTransform: 'capitalize' }}>{item.type}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
