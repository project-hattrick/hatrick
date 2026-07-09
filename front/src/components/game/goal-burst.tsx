'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Flag } from '@/components/common/flag';
import { flagIsoForName, teamInfoFromName } from '@/config/teams.config';
import { TeamSide } from '@/enums/team-side.enum';
import { cn } from '@/lib/utils';
import styles from './goal-burst.module.css';

const LETTERS = ['G', 'O', 'A', 'L'] as const;

/** Full sequence length (ms). Self-held: the engine's goal freeze is shorter than the timeline
 *  (2s with the replay flow), so the overlay plays out over the replay like a broadcast graphic. */
const HOLD = 4600;
const EXIT_FADE = 400;

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
  /** Scorer's country/brand color (flag palette) for the rule + pulse; falls back to generic side colors. */
  accent?: string;
}

type Snapshot = Required<Pick<GoalBurstProps, 'team' | 'blueName' | 'redName' | 'clock'>> &
  Pick<GoalBurstProps, 'scoreBlue' | 'scoreRed' | 'accent'>;

/** Flag above the 3-letter code — mirrors the hero scoreboard's team column. */
function TeamColumn({ name, side }: { name: string; side: TeamSide }) {
  const iso = flagIsoForName(name);
  const code = teamInfoFromName(name, side).code;
  return (
    <span className={styles.teamColumn}>
      {iso ? <Flag code={iso} className={styles.flag} /> : null}
      <span className={styles.code}>{code}</span>
    </span>
  );
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
 * Broadcast goal sequence, triggered on the rising edge of the engine's goal freeze and self-held
 * for the full timeline: staggered GOAL letters + team-colored rule + caption, then the letters
 * clear and the scoreboard pill rises to center with the scoring side's digit rolling in.
 * Data is snapshotted at the goal so the board holds steady while the replay plays underneath.
 */
export function GoalBurst({ active, team = '', blueName = 'Blue', redName = 'Red', scoreBlue, scoreRed, clock, accent }: GoalBurstProps) {
  const [phase, setPhase] = useState<'idle' | 'play' | 'exit'>('idle');
  const [snap, setSnap] = useState<Snapshot | null>(null);

  // Latest props readable from the trigger effect without re-arming it mid-sequence.
  const propsRef = useRef<Snapshot>({ team, blueName, redName, clock: clock ?? '', scoreBlue, scoreRed, accent });
  propsRef.current = { team, blueName, redName, clock: clock ?? '', scoreBlue, scoreRed, accent };

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  useEffect(() => {
    // Rising edge only — the falling edge (engine cuts to the replay) must NOT cancel the sequence.
    if (!active) return;
    timersRef.current.forEach(clearTimeout);
    setSnap(propsRef.current);
    setPhase('play');
    timersRef.current = [
      setTimeout(() => setPhase('exit'), HOLD - EXIT_FADE),
      setTimeout(() => setPhase('idle'), HOLD),
    ];
  }, [active]);

  if (phase === 'idle' || !snap) return null;

  const scorerName = snap.team === 'blue' ? snap.blueName : snap.team === 'red' ? snap.redName : '';
  const hasBoard = snap.scoreBlue != null && snap.scoreRed != null;

  return (
    <div
      className={cn(styles.overlay, phase === 'exit' && styles.exit)}
      style={{ '--goal-accent': snap.accent ?? TEAM_ACCENT[snap.team] ?? 'var(--color-neon)' } as CSSProperties}
      aria-label="GOAL"
    >
      <div className={styles.scrim} />
      <div className={styles.pulse} />

      <div className={styles.center}>
        <div className={styles.word}>
          {LETTERS.map((letter, i) => (
            <span key={letter} className={styles.mask}>
              <b style={{ '--in': `${0.05 + i * 0.08}s`, '--out': `${1.5 + i * 0.05}s` } as CSSProperties}>{letter}</b>
            </span>
          ))}
        </div>
        <div className={styles.rule} />
        <div className={styles.sub}>
          {scorerName ? `${scorerName} scores` : 'Goal'}
          {snap.clock ? ` · ${snap.clock}` : ''}
        </div>
      </div>

      {hasBoard ? (
        <div className={styles.board}>
          <TeamColumn name={snap.blueName} side={TeamSide.Home} />
          <span className={styles.scoreline}>
            <Roll value={snap.scoreBlue!} scored={snap.team === 'blue'} />
            <span className={styles.dash}>–</span>
            <Roll value={snap.scoreRed!} scored={snap.team === 'red'} />
          </span>
          <TeamColumn name={snap.redName} side={TeamSide.Away} />
        </div>
      ) : null}
    </div>
  );
}
