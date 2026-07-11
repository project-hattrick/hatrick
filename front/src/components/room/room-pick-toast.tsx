'use client';

import { useEffect, useRef, useState } from 'react';

import { GlassPanel } from '@/components/common/glass-panel';
import { UserAvatar } from '@/components/common/user-avatar';
import { useRoomPicks, type RoomPick } from '@/store/room-picks.store';
import { cn } from '@/lib/utils';

const DWELL_MS = 4_500;
const EXIT_MS = 300;

/**
 * The pick pop-in: when someone in the room places a pick, a small glass pill
 * slides in with their photo and what they backed, then fades away. Purely
 * presentational — positioning is the parent layout's job.
 */
export function RoomPickToast() {
  const picks = useRoomPicks();
  // undefined = first run pending; after that, the last pick id already shown/skipped.
  const seenLatest = useRef<string | null | undefined>(undefined);
  const [visible, setVisible] = useState<RoomPick | null>(null);
  const [leaving, setLeaving] = useState(false);

  const latest = picks[0];

  useEffect(() => {
    // Baseline on mount: picks that already existed never toast.
    if (seenLatest.current === undefined) {
      seenLatest.current = latest?.id ?? null;
      return;
    }
    if (!latest || latest.id === seenLatest.current) return;
    seenLatest.current = latest.id;
    setVisible(latest);
    setLeaving(false);
    const exitTimer = window.setTimeout(() => setLeaving(true), DWELL_MS);
    const clearTimer = window.setTimeout(() => setVisible(null), DWELL_MS + EXIT_MS);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(clearTimer);
    };
  }, [latest]);

  if (!visible) return null;

  return (
    <GlassPanel
      tone="blur"
      radius="pill"
      className={cn(
        'pointer-events-none flex items-center gap-2.5 px-3 py-2',
        visible.isSelf && 'border-neon/50',
        leaving
          ? 'animate-out fade-out slide-out-to-bottom-2 fill-mode-forwards duration-300'
          : 'animate-in fade-in slide-in-from-bottom-2 duration-300',
      )}
    >
      <UserAvatar
        src={visible.avatarSrc}
        alt={visible.name}
        size={28}
        className="rounded-full ring-2 ring-neon/40"
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-xs font-semibold text-foreground">
          {visible.isSelf ? 'You' : visible.name}
        </span>
        <span className="truncate text-micro text-muted-foreground">{visible.label}</span>
      </span>
      <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-neon">
        @ {visible.odds.toFixed(2)}
      </span>
    </GlassPanel>
  );
}
