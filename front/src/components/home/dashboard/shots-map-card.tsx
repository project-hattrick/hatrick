'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { useDashboardMatch } from './use-dashboard-match';

/**
 * "Shots Map" — each side's efforts plotted in its attacking half, coloured by outcome. Positions are
 * derived deterministically from the matchup (same seeded approach as the rest of the dashboard), so a
 * given fixture always maps the same shots; counts follow the real/derived shot tallies.
 */

type ShotStatus = 'on' | 'off' | 'blocked';

const STATUS: Record<ShotStatus, { color: string; label: string }> = {
  on: { color: '#5cc86a', label: 'On Target' },
  off: { color: '#e5484d', label: 'Off Target' },
  blocked: { color: '#8a8f98', label: 'Blocked' },
};

interface Shot {
  x: number;
  y: number;
  status: ShotStatus;
}

/** Deterministic PRNG (FNV-1a seed → mulberry32) — same pattern used across the dashboard derivations. */
function seededRng(key: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Scatter `count` shots in a side's attacking half (home shoots right, away shoots left). */
function shotsFor(rng: () => number, side: 'home' | 'away', count: number): Shot[] {
  const shots: Shot[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = side === 'home' ? 54 + rng() * 40 : 6 + rng() * 40;
    const y = 14 + rng() * 72;
    const roll = rng();
    const status: ShotStatus = roll < 0.4 ? 'on' : roll < 0.78 ? 'off' : 'blocked';
    shots.push({ x, y, status });
  }
  return shots;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function Marker({ shot }: { shot: Shot }) {
  const { color } = STATUS[shot.status];
  return (
    <div
      className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-black/50"
      style={{ left: `${shot.x}%`, top: `${shot.y}%`, backgroundColor: color }}
    />
  );
}

export function ShotsMapCard() {
  const match = useDashboardMatch();
  const shotsLine = match.statLines.find((l) => l.label === 'Shots');
  const rng = seededRng(`shots-${match.home.code}-${match.away.code}`);
  const home = shotsFor(rng, 'home', clamp(shotsLine?.home ?? 8, 4, 9));
  const away = shotsFor(rng, 'away', clamp(shotsLine?.away ?? 6, 4, 9));

  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-col gap-3 p-4">
      <span className="text-sm font-bold">Shots Map</span>

      <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl border border-white/10 bg-[repeating-linear-gradient(90deg,#0d2417_0_9%,#0f2a1b_9%_18%)]">
        <div className="pointer-events-none absolute inset-2 rounded-md border border-white/10" />
        <div className="pointer-events-none absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-white/10" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        {[...home, ...away].map((shot, i) => (
          <Marker key={i} shot={shot} />
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 text-micro font-semibold text-muted-foreground">
        {(Object.keys(STATUS) as ShotStatus[]).map((key) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: STATUS[key].color }} />
            {STATUS[key].label}
          </span>
        ))}
      </div>
    </GlassPanel>
  );
}
