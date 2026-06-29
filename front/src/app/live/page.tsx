'use client';

import { useRealtime } from '@/services/realtime/use-realtime';
import { useMatchStore } from '@/store/match.store';

export default function LivePage() {
  useRealtime();
  const events = useMatchStore((state) => state.events);

  return (
    <div className="flex flex-1 flex-col gap-4 p-8">
      <h2 className="text-2xl font-semibold">Live Mode</h2>
      <p className="text-muted-foreground">
        2D field + live odds + in-match betting (base placeholder).
      </p>
      <p className="text-sm">Realtime events received: {events.length}</p>
    </div>
  );
}
