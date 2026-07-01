'use client';

import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import styles from './goal-burst.module.css';

const ROWS = 7;
const CYCLE = 2.4;
const CENTER = (ROWS - 1) / 2;

/** Stacked neon "GOAL" flash — mounts only while `active` (post-goal freeze). */
export function GoalBurst({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className={styles.overlay} aria-label="GOAL">
      <div className={styles.stack}>
        {Array.from({ length: ROWS }, (_, i) => (
          <span
            key={i}
            className={cn(styles.word, i === CENTER && styles.center)}
            style={{ '--d': `${(-(ROWS - 1 - i) * CYCLE) / ROWS}s` } as CSSProperties}
          >
            GOAL
          </span>
        ))}
      </div>
    </div>
  );
}
