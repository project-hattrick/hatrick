'use client';

import { SoccerBall } from '@/components/common/icons';
import { cn } from '@/lib/utils';
import styles from './kick-burst.module.css';

/**
 * A one-shot "kick" shockwave — concentric neon rings + a struck ball — played when the squad is
 * locked. Calls `onDone` when the ball's animation ends, so the host can advance the step.
 */
export function KickBurst({ onDone }: { onDone: () => void }) {
  return (
    <div className={styles.burst} aria-hidden>
      <span className={styles.ring} />
      <span className={cn(styles.ring, styles.ring2)} />
      <span className={cn(styles.ring, styles.ring3)} />
      <SoccerBall className={cn(styles.ball, 'size-16 text-neon')} weight="fill" onAnimationEnd={onDone} />
    </div>
  );
}
