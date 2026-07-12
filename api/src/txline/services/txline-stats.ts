import { RawScoreEvent } from '../txline.types';

/** One home/away counter pair. */
export interface StatTally {
  home: number;
  away: number;
}

/**
 * Authoritative team-stat totals derived from the FULL scores snapshot. Only stats TxLINE actually
 * carries as countable action events are here — possession % and passes are NOT provided by the feed
 * and are intentionally omitted (see the /fixtures/:id/stats endpoint).
 */
export interface TeamStats {
  shots: StatTally;
  shotsOnTarget: StatTally;
  fouls: StatTally;
  corners: StatTally;
  yellowCards: StatTally;
  redCards: StatTally;
  offsides: StatTally;
}

const tally = (): StatTally => ({ home: 0, away: 0 });
export const emptyTeamStats = (): TeamStats => ({
  shots: tally(),
  shotsOnTarget: tally(),
  fouls: tally(),
  corners: tally(),
  yellowCards: tally(),
  redCards: tally(),
  offsides: tally(),
});

/** Shot-family actions (exact, so `shootout`/`penalty_shootout` never read as a shot). */
const SHOT_ACTIONS = new Set(['shot', 'shot_on_target', 'shot_off_target', 'shot_blocked']);

/**
 * Fold one authoritative event into the totals. Mirrors the front tally
 * (front/src/store/match.store.ts → tallyEvent) so both sides agree, but leans on the structured
 * `dataSoccer` qualifiers (Goal / Outcome / Corner / FreeKickType) which are more reliable than the
 * action string alone. Keep the two in sync.
 */
function tallyOne(stats: TeamStats, e: RawScoreEvent): void {
  const p = e.dataSoccer?.Participant;
  if (p !== 1 && p !== 2) return;
  const side: keyof StatTally = p === 1 ? 'home' : 'away';
  const a = (e.action ?? '').toLowerCase();
  const d = e.dataSoccer ?? {};
  const add = (key: keyof TeamStats) => {
    stats[key][side] += 1;
  };

  // A goal is by definition a shot on target; the wire classifies the moment once.
  if (a === 'goal' || d.Goal === true) {
    add('shots');
    add('shotsOnTarget');
  } else if (SHOT_ACTIONS.has(a)) {
    add('shots');
    if (a === 'shot_on_target' || d.Outcome === 'OnTarget') add('shotsOnTarget');
  }
  if (a === 'yellow_card' || d.YellowCard === true) add('yellowCards');
  if (a === 'red_card' || d.RedCard === true) add('redCards');
  if (a === 'corner' || d.Corner === true) add('corners');
  if (a.includes('foul')) add('fouls');
  if (a.includes('offside') || d.FreeKickType === 'Offside') add('offsides');
}

/**
 * Authoritative team stats from a fixture's FULL scores snapshot. Dedups the during/after pair per
 * `seq` (a logical event shares one seq across its optimistic + confirmed frames), preferring the
 * confirmed frame, so nothing is double-counted and the totals only ever reflect settled events.
 */
export function tallyTeamStats(events: RawScoreEvent[]): TeamStats {
  const bySeq = new Map<number, RawScoreEvent>();
  for (const e of events) {
    const prev = bySeq.get(e.seq);
    // Prefer the authoritative (confirmed) frame; between same-confirmation frames, the later ts wins.
    if (!prev || (e.confirmed && !prev.confirmed) || (e.confirmed === prev.confirmed && e.ts >= prev.ts)) {
      bySeq.set(e.seq, e);
    }
  }
  const stats = emptyTeamStats();
  for (const e of bySeq.values()) tallyOne(stats, e);
  return stats;
}
