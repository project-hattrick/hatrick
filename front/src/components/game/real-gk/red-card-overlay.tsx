'use client';

import styles from './red-card-overlay.module.css';

/** Center-screen red card that slams in while the referee brandishes it (play frozen). */
export function RedCardOverlay({ active, playerName = '' }: { active: boolean; playerName?: string }) {
  if (!active) return null;

  return (
    <div className={styles.overlay} aria-label="Red card">
      <div className={styles.card} />
      <span className={styles.label}>Red Card</span>
      {playerName ? <span className={styles.name}>{playerName} is off</span> : null}
    </div>
  );
}
