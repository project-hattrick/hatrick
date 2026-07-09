/** Sides of a simulated duel (home = the signed-in player / engine Blue, away = opponent / Red). */
export enum DuelSimTeam {
  Home = 'home',
  Away = 'away',
}

/** How a simulated chance resolves — each maps to a visual beat the arena director stages. */
export enum ChanceOutcome {
  Goal = 'goal',
  SavedShot = 'saved_shot',
  OffTargetShot = 'off_target_shot',
  Corner = 'corner',
  Steal = 'steal',
}

/** Six-attribute block shared by every card shape in the app (PlayerStats mirror). */
export interface SimStats {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

/** Normalized card input for the simulator (adapters in strength.ts build these from app card shapes). */
export interface SimCard {
  name: string;
  rating: number;
  /** Field position label ('GK', 'ST', 'CM', …). Unknown/empty is treated as a midfielder. */
  position: string;
  stats: SimStats;
}

/** Squad ratings the chance-battle rolls against (Hattrick-style: midfield → attack vs defense → GK). */
export interface TeamStrength {
  midfield: number;
  attack: number;
  defense: number;
  keeper: number;
}

/** One resolved chance on the simulated timeline. */
export interface DuelChanceEvent {
  /** Simulated match minute (0–90). */
  simMinute: number;
  /** The attacking side of this chance (for Steal, the side that LOST the ball). */
  team: DuelSimTeam;
  outcome: ChanceOutcome;
  /** Attacking player the beat is attributed to (scorer on Goal). */
  player: string;
}

/** Full pre-rolled match: every chance beat plus the authoritative final score. */
export interface DuelTimeline {
  events: DuelChanceEvent[];
  homeScore: number;
  awayScore: number;
}
