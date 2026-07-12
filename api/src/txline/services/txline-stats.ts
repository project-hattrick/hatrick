import { PlayerMatchStats, RawScoreEvent } from '../txline.types';

/** One home/away counter pair. */
export interface StatTally {
  home: number;
  away: number;
}

/**
 * Team-stat totals for a fixture. TxLINE only TOTALS four of these authoritatively
 * (Corners/YellowCards/RedCards via `Score.Total`; goals drive the score, not shown here). `shots`
 * comes from summing sparse per-player `PlayerStats.shots`. `shotsOnTarget`/`fouls`/`offsides` are
 * NOT provided as totals by the provider — they stay 0 here and are filled by the live socket tally.
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

/** Sum one sparse per-player counter across a side's players. */
function sumCounter(side: Record<string, PlayerMatchStats>, key: keyof PlayerMatchStats): number {
  let total = 0;
  for (const player of Object.values(side)) total += player[key] ?? 0;
  return total;
}

/**
 * Derive the authoritative team stats from a fixture's scores snapshot. The snapshot returns the LAST
 * event per action, so COUNTING action events undercounts badly (e.g. 8 corners read as 1). Instead:
 *  - Corners / YellowCards / RedCards ← the highest-seq `Score.ParticipantN.Total` counters (authoritative).
 *  - Shots ← sum of the latest `PlayerStats.shots` per side (sparse; often absent → stays 0).
 *  - ShotsOnTarget / Fouls / Offsides ← 0 (TxLINE doesn't total them; the live socket tally fills them).
 */
export function deriveTeamStats(events: RawScoreEvent[]): TeamStats {
  const stats = emptyTeamStats();
  let scoreSeq = -1;
  let playerSeq = -1;
  for (const e of events) {
    // `homeGoals` is set whenever the event carries a Score object (even at 0-0), so it marks one.
    if (e.homeGoals !== undefined && e.seq >= scoreSeq) {
      scoreSeq = e.seq;
      stats.corners = { home: e.homeCorners ?? 0, away: e.awayCorners ?? 0 };
      stats.yellowCards = { home: e.homeYellowCards ?? 0, away: e.awayYellowCards ?? 0 };
      stats.redCards = { home: e.homeRedCards ?? 0, away: e.awayRedCards ?? 0 };
    }
    if (e.playerStats && e.seq >= playerSeq) {
      playerSeq = e.seq;
      stats.shots = {
        home: sumCounter(e.playerStats.home, 'shots'),
        away: sumCounter(e.playerStats.away, 'shots'),
      };
    }
  }
  return stats;
}
