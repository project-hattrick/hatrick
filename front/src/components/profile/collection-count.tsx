'use client';

import { useFantasyStore } from '@/store/fantasy.store';

/** Live count of owned cards for the profile Collection header. */
export function CollectionCount() {
  const count = useFantasyStore((s) => s.collection.length);
  return <span className="text-micro text-muted-foreground">{count} players</span>;
}
