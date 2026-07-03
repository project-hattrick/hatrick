'use client';

import styles from './restart-banner.module.css';

/** Broadcast lower-third naming the current dead-ball restart (CORNER / THROW-IN / GOAL KICK). */
export function RestartBanner({ active, label }: { active: boolean; label: string }) {
  if (!active || !label) return null;

  return (
    <div className={styles.wrap} aria-label={label}>
      <div className={styles.pill}>
        <span className={styles.dot} />
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
