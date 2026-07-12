'use client';

import { useMemo } from 'react';

import { mergeStatsMax, useAuthoritativeStats, useDisplayMatch, useHasFeedStats, useMatchStats } from '@/store/match.store';
import { fifaToIso } from '@/lib/country';
import type { StatLine } from '@/config/match-dashboard.config';
import type { LiveMatchStats, StatTally } from '@/store/match.store';
import type { LiveMatch } from '@/types/match';

// DS accents — home reads as the neon side, away as the gold side (matches DualStat bars).
const HOME_COLOR = '#aef019';
const AWAY_COLOR = '#e2b33c';
const PERF_LABELS = ['0m', '15m', '30m', '45m', '60m', '75m', '90m'];

export interface DashboardTeam {
  name: string;
  /** FIFA short code (ARG). */
  code: string;
  /** flag-icons code (ar). */
  iso: string;
  color: string;
}

export interface DashboardMatch {
  home: DashboardTeam;
  away: DashboardTeam;
  score: { home: number; away: number };
  minute: number;
  /** Compact 3-line set for the live card. */
  liveStats: StatLine[];
  /** Full 8-line comparison. */
  statLines: StatLine[];
  perfLabels: string[];
  perfHome: number[];
  perfAway: number[];
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Deterministic PRNG (mulberry32 over an FNV-1a hash): a given matchup always derives the same stats. */
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

/**
 * Turn the selected LiveMatch into the dashboard view-model. Team identity (name/code/flag) is real.
 * The stat lines show ONLY what the feed actually carries as events — real tallies (`stats`) or 0,
 * never invented. Possession % and passes are dropped on purpose: TxLINE provides neither. The
 * performance series stays a deterministic momentum sketch (cosmetic, not claimed stats).
 */
export function deriveDashboard(match: LiveMatch, stats?: LiveMatchStats | null): DashboardMatch {
  const rng = seededRng(`${match.home.code}-${match.away.code}`);
  const rint = (min: number, max: number) => Math.floor(min + rng() * (max - min + 1));
  const lead = clamp(match.score.home - match.score.away, -3, 3);

  // Real tally or 0 — no fabricated numbers.
  const line = (label: string, pick: (t: LiveMatchStats) => StatTally): StatLine => ({
    label,
    home: stats ? pick(stats).home : 0,
    away: stats ? pick(stats).away : 0,
  });

  const liveStats: StatLine[] = [
    line('Shots on Target', (t) => t.shotsOnTarget),
    line('Shots', (t) => t.shots),
    line('Fouls', (t) => t.fouls),
  ];

  const statLines: StatLine[] = [
    line('Shots', (t) => t.shots),
    line('Shots on Target', (t) => t.shotsOnTarget),
    line('Corner', (t) => t.corners),
    line('Fouls', (t) => t.fouls),
    line('Yellow Card', (t) => t.yellowCards),
    line('Red Card', (t) => t.redCards),
    line('Offside', (t) => t.offsides),
  ];

  const series = (bias: number): number[] => {
    let v = rint(24, 44);
    const pts: number[] = [];
    for (let i = 0; i < PERF_LABELS.length; i += 1) {
      v = clamp(v + rint(-8, 12) + bias, 12, 92);
      pts.push(v);
    }
    return pts;
  };

  return {
    home: { name: match.home.name, code: match.home.code, iso: fifaToIso(match.home.code), color: HOME_COLOR },
    away: { name: match.away.name, code: match.away.code, iso: fifaToIso(match.away.code), color: AWAY_COLOR },
    score: match.score,
    minute: match.minute,
    liveStats,
    statLines,
    perfLabels: PERF_LABELS,
    perfHome: series(lead > 0 ? 3 : 0),
    perfAway: series(lead < 0 ? 3 : 0),
  };
}

/** Reactive dashboard view-model bound to the currently-selected match. */
export function useDashboardMatch(): DashboardMatch {
  const match = useDisplayMatch();
  const live = useMatchStats();
  const auth = useAuthoritativeStats();
  const hasFeed = useHasFeedStats();
  // Authoritative snapshot (full-match tally) is the truth for a live match; max() with the live tally
  // keeps sub-poll increments instant AND monotonic. No feed at all → null (zeros, never invented).
  const stats = useMemo(
    () => (auth ? mergeStatsMax(auth, live) : hasFeed ? live : null),
    [auth, live, hasFeed],
  );
  return useMemo(
    () => deriveDashboard(match, stats),
    // Re-derive when identity, score/minute or the (merged) stats change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [match.home.code, match.away.code, match.home.name, match.away.name, match.score.home, match.score.away, match.minute, stats],
  );
}
