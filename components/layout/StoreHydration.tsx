'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';

export function StoreHydration({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => {
      useStore.getState().setHydrated();
      setReady(true);
    });
    useStore.persist.rehydrate();
    if (useStore.persist.hasHydrated()) {
      useStore.getState().setHydrated();
      setReady(true);
    }
    return unsub;
  }, []);

  if (!ready) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: 13,
      }}>
        Loading your data…
      </div>
    );
  }

  return <>{children}</>;
}
