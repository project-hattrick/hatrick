'use client';

const TEAM_ACCENT: Record<string, string> = { blue: '#4da3ff', red: '#ff5a5a' };

interface FullTimeOverlayProps {
  active: boolean;
  blueName: string;
  redName: string;
  scoreBlue: number;
  scoreRed: number;
  /** 'blue' | 'red' | '' (draw). */
  winnerTeam: string;
}

/** Broadcast result card shown once the engine enters full time (final score + winner callout). */
export function FullTimeOverlay({ active, blueName, redName, scoreBlue, scoreRed, winnerTeam }: FullTimeOverlayProps) {
  if (!active) return null;
  const winnerName = winnerTeam === 'blue' ? blueName : winnerTeam === 'red' ? redName : '';
  const accent = TEAM_ACCENT[winnerTeam] ?? '#ffd34d';

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
      <div className="flex animate-in fade-in zoom-in-95 flex-col items-center gap-3 rounded-2xl border border-white/12 bg-black/70 px-10 py-7 text-center shadow-[0_0_60px_rgba(0,0,0,0.6)]">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/60">Full time</span>
        <div className="flex items-center gap-5">
          <span className="max-w-[26vw] truncate text-lg font-semibold" style={{ color: TEAM_ACCENT.blue }}>
            {blueName}
          </span>
          <span className="font-mono text-5xl font-bold tabular-nums text-white">
            {scoreBlue}
            <span className="mx-2 text-white/35">-</span>
            {scoreRed}
          </span>
          <span className="max-w-[26vw] truncate text-lg font-semibold" style={{ color: TEAM_ACCENT.red }}>
            {redName}
          </span>
        </div>
        <span className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>
          {winnerName ? `${winnerName} win the match` : 'Ends level'}
        </span>
      </div>
    </div>
  );
}
