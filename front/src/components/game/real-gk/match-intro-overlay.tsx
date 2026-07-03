'use client';

import { FlagSvg } from './flags';
import styles from './match-intro-overlay.module.css';

interface MatchIntroOverlayProps {
  active: boolean;
  stage: string;
  blueName: string;
  redName: string;
  blueFlag: string;
  redFlag: string;
}

/** Broadcast team + flag card shown while the v5 intro is on its Showcase beat, before the players walk on. */
export function MatchIntroOverlay({ active, stage, blueName, redName, blueFlag, redFlag }: MatchIntroOverlayProps) {
  if (!active || stage !== 'showcase') return null;

  return (
    <div className={styles.overlay} aria-label="Match intro">
      <div className={styles.card}>
        <div className={`${styles.team} ${styles.blue}`}>
          <FlagSvg id={blueFlag} className={styles.flag} />
          <span className={styles.name}>{blueName}</span>
        </div>
        <span className={styles.vs}>VS</span>
        <div className={`${styles.team} ${styles.red}`}>
          <FlagSvg id={redFlag} className={styles.flag} />
          <span className={styles.name}>{redName}</span>
        </div>
      </div>
      <span className={styles.tag}>Matchday · Kickoff</span>
    </div>
  );
}
