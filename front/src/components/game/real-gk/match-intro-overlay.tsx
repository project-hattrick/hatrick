'use client';

import { Flag } from '@/components/common/flag';
import { flagIsoForName } from '@/config/teams.config';
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

/** Real country flag (flag-icons) when the name is a known nation, else the engine's placeholder. */
function IntroFlag({ name, fallbackId }: { name: string; fallbackId: string }) {
  const iso = flagIsoForName(name);
  if (iso) return <Flag code={iso} className={`${styles.flag} bg-cover`} />;
  return <FlagSvg id={fallbackId} className={styles.flag} />;
}

/** Broadcast team + flag card shown while the v5 intro is on its Showcase beat, before the players walk on. */
export function MatchIntroOverlay({ active, stage, blueName, redName, blueFlag, redFlag }: MatchIntroOverlayProps) {
  if (!active || stage !== 'showcase') return null;

  return (
    <div className={styles.overlay} aria-label="Match intro">
      <div className={styles.card}>
        <div className={`${styles.team} ${styles.blue}`}>
          <IntroFlag name={blueName} fallbackId={blueFlag} />
          <span className={styles.name}>{blueName}</span>
        </div>
        <span className={styles.vs}>VS</span>
        <div className={`${styles.team} ${styles.red}`}>
          <IntroFlag name={redName} fallbackId={redFlag} />
          <span className={styles.name}>{redName}</span>
        </div>
      </div>
      <span className={styles.tag}>Matchday · Kickoff</span>
    </div>
  );
}
