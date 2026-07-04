'use client';

import styles from './restart-banner.module.css';

const TEAM_ACCENT: Record<string, string> = { blue: '#4da3ff', red: '#ff5a5a' };

/** Broadcast lower-third naming the current dead-ball restart (CORNER / THROW-IN / GOAL KICK / FREE KICK / PENALTY / FOUL). */
export function RestartBanner({ active, label, team, teamName }: { active: boolean; label: string; team: string; teamName: string }) {
  if (!active || !label) return null;
  const accent = TEAM_ACCENT[team] ?? '#ffd34d';

  return (
    // Keyed by label so the slide-in replays when the call changes mid-stoppage (FOUL → PENALTY).
    <div key={label} className={styles.wrap} aria-label={label}>
      <div className={styles.pill}>
        <span className={styles.dot} style={{ background: accent, boxShadow: `0 0 12px ${accent}` }} />
        <span className={styles.label}>{label}</span>
        {teamName ? (
          <>
            <span className={styles.divider} />
            <span className={styles.team} style={{ color: accent }}>
              {teamName}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
