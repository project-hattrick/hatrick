'use client';

import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import styles from './goal-burst.module.css';

const LETTERS = ['G', 'O', 'A', 'L'] as const;

/** Scoring side → accent (engine team ids); anything else falls back to the DS neon. */
const TEAM_ACCENT: Record<string, string> = {
  blue: 'var(--color-team-home)',
  red: 'var(--color-team-away)',
};

interface GoalBurstProps {
  active: boolean;
  /** Scoring side ('blue' | 'red') — colors the pulse/rule and rolls that side's digit. */
  team?: string;
  blueName?: string;
  redName?: string;
  /** Post-goal scores; omit either to skip the scoreboard phase (word-only flash). */
  scoreBlue?: number;
  scoreRed?: number;
  /** Match clock at the goal (e.g. "63:12") — shown in the caption. */
  clock?: string;
}

/** One scoreboard digit; the scoring side rolls prev → new mid-timeline. */
function Roll({ value, scored }: { value: number; scored: boolean }) {
  return (
    <span className={cn(styles.roll, scored && styles.rollScored)}>
      <span className={styles.rollColumn}>
        <span>{scored ? Math.max(0, value - 1) : value}</span>
        {scored ? <span>{value}</span> : null}
      </span>
    </span>
  );
}

/**
 * Broadcast goal sequence (mounts only while the engine's post-goal freeze is active, ~3.6s):
 * staggered GOAL letters + team-colored rule + caption, then the letters clear and the scoreboard
 * pill rises to center with the scoring side's digit rolling in.
 */
export function GoalBurst({ active, team = '', blueName = 'Blue', redName = 'Red', scoreBlue, scoreRed, clock }: GoalBurstProps) {
  if (!active) return null;

  const scorerName = team === 'blue' ? blueName : team === 'red' ? redName : '';
  const hasBoard = scoreBlue != null && scoreRed != null;

  return (
    <div
      className={styles.overlay}
      style={{ '--goal-accent': TEAM_ACCENT[team] ?? 'var(--color-neon)' } as CSSProperties}
      aria-label="GOAL"
    >
      <div className={styles.scrim} />
      <div className={styles.pulse} />

      <div className={styles.center}>
        <div className={styles.word}>
          {LETTERS.map((letter, i) => (
            <span key={letter} className={styles.mask}>
              <b style={{ '--in': `${0.05 + i * 0.07}s`, '--out': `${1.35 + i * 0.05}s` } as CSSProperties}>{letter}</b>
            </span>
          ))}
        </div>
        <div className={styles.rule} />
        <div className={styles.sub}>
          {scorerName ? `${scorerName} scores` : 'Goal'}
          {clock ? ` · ${clock}` : ''}
        </div>
      </div>

      {hasBoard ? (
        <div className={styles.board}>
          <span className={styles.side}>
            <i className={styles.dot} style={{ background: 'var(--color-team-home)' }} />
            {blueName}
          </span>
          <span className={styles.plate}>
            <Roll value={scoreBlue} scored={team === 'blue'} />
            <span className={styles.sep}>–</span>
            <Roll value={scoreRed} scored={team === 'red'} />
          </span>
          <span className={styles.side}>
            {redName}
            <i className={styles.dot} style={{ background: 'var(--color-team-away)' }} />
          </span>
        </div>
      ) : null}
    </div>
  );
}
