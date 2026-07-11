'use client';

import { useMemo } from 'react';

import { useDisplayMatch, useHasFeedStats, useMatchStats } from '@/store/match.store';
import { fifaToIso } from '@/lib/country';
import type { StatLine } from '@/config/match-dashboard.config';
import type { LiveMatchStats } from '@/store/match.store';
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
 * Turn the selected LiveMatch into the dashboard view-model. Team identity (name/code/flag) is real,
 * and when the feed is streaming (`feedStats`) the countable lines (shots, cards, fouls, corners…)
 * are REAL event tallies from the match store. Only the numbers no feed carries (possession share,
 * passes, the performance series) stay derived deterministically from the two codes + score.
 */
export function deriveDashboard(match: LiveMatch, feedStats?: LiveMatchStats | null): DashboardMatch {
  const rng = seededRng(`${match.home.code}-${match.away.code}`);
  const rint = (min: number, max: number) => Math.floor(min + rng() * (max - min + 1));
  const lead = clamp(match.score.home - match.score.away, -3, 3);

  const sotHome = feedStats ? feedStats.shotsOnTarget.home : match.score.home + rint(1, 5);
  const sotAway = feedStats ? feedStats.shotsOnTarget.away : match.score.away + rint(1, 5);
  const shotHome = feedStats ? feedStats.shots.home : sotHome + rint(2, 8);
  const shotAway = feedStats ? feedStats.shots.away : sotAway + rint(2, 8);
  const foulHome = feedStats ? feedStats.fouls.home : rint(4, 13);
  const foulAway = feedStats ? feedStats.fouls.away : rint(4, 13);

  // Possession share: proxy from possession-family event counts when the feed provides them.
  const possTotal = feedStats ? feedStats.possessionEvents.home + feedStats.possessionEvents.away : 0;
  const possHome =
    possTotal > 0
      ? clamp(Math.round((feedStats!.possessionEvents.home / possTotal) * 100), 20, 80)
      : clamp(50 + lead * 3 + rint(-6, 6), 36, 64);
  const possAway = 100 - possHome;
  const passHome = Math.round(possHome * 9 + rint(-40, 40));
  const passAway = Math.round(possAway * 9 + rint(-40, 40));

  const liveStats: StatLine[] = [
    { label: 'Shots on Target', home: sotHome, away: sotAway },
    { label: 'Shots', home: shotHome, away: shotAway },
    { label: 'Fouls', home: foulHome, away: foulAway },
  ];

  const statLines: StatLine[] = [
    { label: 'Pass', home: passHome, away: passAway },
    { label: 'Shots', home: shotHome, away: shotAway },
    { label: 'Shots on Target', home: sotHome, away: sotAway },
    { label: 'Ball Possession', home: possHome, away: possAway },
    {
      label: 'Red Card',
      home: feedStats ? feedStats.redCards.home : rng() < 0.1 ? 1 : 0,
      away: feedStats ? feedStats.redCards.away : rng() < 0.1 ? 1 : 0,
    },
    {
      label: 'Yellow Card',
      home: feedStats ? feedStats.yellowCards.home : rint(0, 4),
      away: feedStats ? feedStats.yellowCards.away : rint(0, 5),
    },
    {
      label: 'Offside',
      home: feedStats ? feedStats.offsides.home : rint(0, 5),
      away: feedStats ? feedStats.offsides.away : rint(0, 5),
    },
    {
      label: 'Corner',
      home: feedStats ? feedStats.corners.home : rint(2, 9),
      away: feedStats ? feedStats.corners.away : rint(2, 9),
    },
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
  const stats = useMatchStats();
  const hasFeed = useHasFeedStats();
  return useMemo(
    () => deriveDashboard(match, hasFeed ? stats : null),
    // Re-derive when identity, score/minute or the feed tallies change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [match.home.code, match.away.code, match.home.name, match.away.name, match.score.home, match.score.away, match.minute, stats, hasFeed],
  );
}
