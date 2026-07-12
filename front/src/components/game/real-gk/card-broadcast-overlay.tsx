'use client';

import { useEffect, useState } from 'react';

import { useRealGkStore } from '@/store/real-gk.store';
import styles from './card-broadcast-overlay.module.css';

interface Flash {
  color: 'yellow' | 'red';
  team: string;
  key: number;
}

/**
 * Feed-driven card broadcast: subscribes to the engine's `cardFlashSeq` (bumped once per carded event)
 * and slams a yellow/red card graphic on screen for a beat, then fades it out. Play keeps rolling
 * underneath. Only active where the engine bridges its HUD into the store (e.g. the room's ambient pitch).
 */
export function CardBroadcastOverlay({ blueName, redName }: { blueName?: string; redName?: string }) {
  const [flash, setFlash] = useState<Flash | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Subscribe for new cards. Setting state from the subscription callback is the endorsed pattern for
  // reacting to an external store (no cascading render from a synchronous setState in the effect body).
  useEffect(() => {
    const unsub = useRealGkStore.subscribe((s, prev) => {
      if (s.cardFlashSeq === prev.cardFlashSeq || s.cardFlashSeq <= 0) return;
      if (s.cardFlashColor !== 'yellow' && s.cardFlashColor !== 'red') return;
      const team = s.cardFlashTeam === 'red' ? redName : blueName;
      setLeaving(false);
      setFlash({ color: s.cardFlashColor, team: team ?? '', key: s.cardFlashSeq });
    });
    return unsub;
  }, [blueName, redName]);

  // Auto-dismiss timers keyed on the flash ITSELF — deliberately separate from the subscription effect so
  // a team-name prop change (a room match switch) can never cancel an in-flight dismissal and leave a
  // card frozen on screen. A new card = a new `flash` object → this re-runs and restarts the timers.
  useEffect(() => {
    if (!flash) return;
    const leaveT = window.setTimeout(() => setLeaving(true), 2000);
    const hideT = window.setTimeout(() => setFlash(null), 2400);
    return () => {
      window.clearTimeout(leaveT);
      window.clearTimeout(hideT);
    };
  }, [flash]);

  if (!flash) return null;

  return (
    <div key={flash.key} className={styles.overlay} data-leaving={leaving} aria-label={`${flash.color} card`}>
      <div className={styles.card} data-color={flash.color} />
      <span className={styles.label}>{flash.color === 'red' ? 'Red Card' : 'Yellow Card'}</span>
      {flash.team ? <span className={styles.team}>{flash.team}</span> : null}
    </div>
  );
}
