import { groupStage, type GroupTeam, type MatchResult } from '@/config/match-dashboard.config';
import { fifaToIso } from '@/lib/country';
import type { LiveMatch } from '@/types/match';

export interface LiveGroupTeam extends GroupTeam {
  /** True for a team in the currently-selected match — highlighted + live-updated. */
  live: boolean;
}
export interface LiveGroup {
  key: string;
  teams: LiveGroupTeam[];
  /** True when the group was synthesized because neither match team sits in a real WC group. */
  synthetic?: boolean;
}

const resultFor = (gf: number, ga: number): MatchResult => (gf > ga ? 'W' : gf < ga ? 'L' : 'D');

/** Fold the currently-watched match into a team's standings row (adds this game, live). */
function withMatch(team: GroupTeam, gf: number, ga: number): LiveGroupTeam {
  const r = resultFor(gf, ga);
  return {
    ...team,
    p: team.p + 1,
    w: team.w + (r === 'W' ? 1 : 0),
    d: team.d + (r === 'D' ? 1 : 0),
    l: team.l + (r === 'L' ? 1 : 0),
    gf: team.gf + gf,
    ga: team.ga + ga,
    pts: team.pts + (r === 'W' ? 3 : r === 'D' ? 1 : 0),
    form: [...team.form, r].slice(-3),
    live: true,
  };
}

/** Standings order: points, then goal difference, then goals for. */
const bySort = (a: LiveGroupTeam, b: LiveGroupTeam) =>
  b.pts - a.pts || b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf;

const blankTeam = (name: string, code: string): GroupTeam => ({
  name, code, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [],
});

/**
 * Live WC group standings for the selected match: whichever of the two teams sit in a real group get this
 * match folded into their row (so they climb/drop as goals land), and the group is re-sorted. When neither
 * team is in a group, a small synthetic group (both teams + two fillers) is prepended so the card still
 * reflects the scoreline. Returns the groups plus the key of the group to show by default.
 */
export function deriveLiveGroups(match: LiveMatch): { groups: LiveGroup[]; liveKey: string } {
  const homeIso = fifaToIso(match.home.code);
  const awayIso = fifaToIso(match.away.code);
  const { home, away } = match.score;

  let homeKey: string | null = null;
  let awayKey: string | null = null;

  const groups: LiveGroup[] = groupStage.map((g) => {
    const teams: LiveGroupTeam[] = g.teams.map((t) => {
      if (t.code === homeIso) {
        homeKey = g.key;
        return withMatch(t, home, away);
      }
      if (t.code === awayIso) {
        awayKey = g.key;
        return withMatch(t, away, home);
      }
      return { ...t, live: false };
    });
    return { key: g.key, teams: teams.sort(bySort) };
  });

  const liveKey = homeKey ?? awayKey;
  if (liveKey) return { groups, liveKey };

  // Neither team charted → synthesize a live mini-group so the standings still move with the score.
  const fillers = groupStage[0].teams.slice(0, 2).map((t) => ({ ...t, live: false }) as LiveGroupTeam);
  const synthetic: LiveGroup = {
    key: '•',
    synthetic: true,
    teams: [
      withMatch(blankTeam(match.home.name, homeIso), home, away),
      withMatch(blankTeam(match.away.name, awayIso), away, home),
      ...fillers,
    ].sort(bySort),
  };
  return { groups: [synthetic, ...groups], liveKey: '•' };
}
