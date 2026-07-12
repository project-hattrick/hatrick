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

/**
 * Team name → one of the inline flag SVGs we hand-drew at 3:2. Preferred over flag-icons for these
 * nations because (a) they carry the exact kit palette and (b) they avoid flag-icons artefacts in this
 * 3:2 card — e.g. Switzerland's real flag is square (1:1), so the flag-icons asset gets stretched/cropped
 * by `background-size: cover`, and England's `gb-eng` subdivision flag isn't always in the sprite.
 * Keyed on the NAME (always the real team), never the engine's flagId (which can be a generic fallback).
 */
const NAME_TO_FLAG_SVG: Record<string, string> = {
  Argentina: 'argentina',
  Brazil: 'brazil',
  Spain: 'spain',
  France: 'france',
  Netherlands: 'netherlands',
  England: 'england',
  Norway: 'norway',
  Switzerland: 'switzerland',
};

/**
 * Flag resolution, most-correct first: our mapped inline SVG for the nations we drew, then a real
 * flag-icons SVG for every other recognised nation, then the engine's own placeholder as a last resort.
 */
function IntroFlag({ name, fallbackId }: { name: string; fallbackId: string }) {
  const trimmed = name.trim();
  const svgId = NAME_TO_FLAG_SVG[trimmed];
  if (svgId) return <FlagSvg id={svgId} className={styles.flag} />;
  const iso = flagIsoForName(trimmed);
  if (iso) return <Flag code={iso} className={styles.flag} />;
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
