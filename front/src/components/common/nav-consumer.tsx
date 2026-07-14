'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePendingNavStore } from '@/store/pending-nav.store';

/**
 * App-wide singleton that drains the pending-navigation store.
 * Socket event handlers (no React context) write a destination here;
 * this component picks it up and calls router.push. Mount once in app-providers.
 */
export function NavConsumer() {
  const router = useRouter();
  const destination = usePendingNavStore((s) => s.destination);
  const consume = usePendingNavStore((s) => s.consume);

  useEffect(() => {
    if (!destination) return;
    consume();
    router.push(destination);
  }, [destination, consume, router]);

  return null;
}
