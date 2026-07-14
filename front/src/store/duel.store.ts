import { create } from 'zustand';
import type { PlayerProfile } from '@/config/duelists.config';
import { DuelResult } from '@/enums/duel-result.enum';
import { DuelLayout } from '@/enums/duel-layout.enum';
import { DuelPhase } from '@/enums/duel-phase.enum';
import { RankTier } from '@/enums/rank-tier.enum';
import { Presence } from '@/enums/presence.enum';
import { duelService, type DuelDetailDto, type DuelResultValue } from '@/services/fantasy.service';
import { isBackendSession } from '@/services/session-mode';
import { authService } from '@/services/auth.service';
import { useWalletStore } from '@/store/wallet.store';
import { useFantasyStore } from '@/store/fantasy.store';

/** Identifies this player's role in a PvP server duel. */
export type DuelRole = 'host' | 'guest';

/** Front DuelResult enum ("win") → api DuelResult ("Win"). */
const toServerResult = (r: DuelResult): DuelResultValue =>
  r === DuelResult.Win ? 'Win' : r === DuelResult.Loss ? 'Loss' : 'Draw';

interface DuelStore {
  /** Stable id for the current /duel/[id] route. */
  duelId: string | null;
  /** Backend duel id once persisted (authed) — drives server-side settlement. */
  serverId: string | null;
  setServerId: (serverId: string | null) => void;
  opponent: PlayerProfile | null;
  /** Token stake agreed for this duel (null = friendly, nothing on the line). */
  bet: number | null;
  /** True while the player is picking their XI/formation, before the arena starts. */
  inSetup: boolean;
  /** Immersive (full-bleed) vs split-view arrangement of the arena chrome. */
  layout: DuelLayout;
  selfScore: number;
  opponentScore: number;
  /** Simulated match clock (0–90') + where the timeline is (mirror of the duel director). */
  simMinute: number;
  phase: DuelPhase;
  finished: boolean;
  result: DuelResult | null;
  /**
   * PvP server duel role. Null means vs-CPU (persona) mode — all existing behaviour
   * stays intact. Set by `startServerDuel` for real 1v1 matches.
   */
  role: DuelRole | null;

  /** Begin a duel against a chosen opponent — opens on the XI/formation setup step. */
  start: (duelId: string, opponent: PlayerProfile, bet?: number) => void;
  /**
   * Wire up a server-side PvP duel received via `duel:ready`. Skips inSetup (both
   * players already picked their XI on the host/join pages). The arena and director
   * behave identically; only settlement branches on role.
   */
  startServerDuel: (detail: DuelDetailDto, role: DuelRole) => void;
  /** Lock the lineup and enter the arena. */
  confirmSetup: () => void;
  /** Flip between the immersive and split-view arena layouts. */
  toggleLayout: () => void;
  /** Push the live scoreline from the duel director (simulator-authoritative). */
  setScore: (selfScore: number, opponentScore: number) => void;
  /** Push the simulated clock + phase from the duel director. */
  setMatchClock: (simMinute: number, phase: DuelPhase) => void;
  /**
   * Freeze the final result. For PvP host: calls server settle. For PvP guest: only
   * updates local state (authoritative result comes via `duel:settled` push). For
   * vs-CPU: original behaviour (calls settle if serverId present).
   */
  finish: (result: DuelResult) => void;
  /** Guest-only: receives the authoritative result from the `duel:settled` push. */
  receiveSettlement: (hostScore: number, guestScore: number, guestResult: DuelResultValue) => void;
  reset: () => void;
}

/** Maps a DuelPlayerDto to the minimal PlayerProfile shape the arena/scoreboard needs. */
function dtoToProfile(p: DuelDetailDto['host']): PlayerProfile {
  return {
    id: p.id,
    username: p.username ?? p.id,
    name: p.displayName ?? p.username ?? 'Opponent',
    country: p.country ?? 'BRA',
    tier: RankTier.Gold,
    division: 'I',
    rating: p.mmr,
    wins: 0,
    losses: 0,
    streak: 'W0',
    portraitSrc: p.avatarUrl ?? '/personas/p01.png',
    presence: Presence.Online,
    bio: '',
    joinedAt: new Date().toISOString(),
  };
}

const serverResultToEnum = (r: DuelResultValue): DuelResult => {
  if (r === 'Win') return DuelResult.Win;
  if (r === 'Loss') return DuelResult.Loss;
  return DuelResult.Draw;
};

/** Current 1v1 duel — ephemeral (never persisted; the live stream stays in memory). */
export const useDuelStore = create<DuelStore>((set, get) => ({
  duelId: null,
  serverId: null,
  setServerId: (serverId) => set({ serverId }),
  opponent: null,
  bet: null,
  inSetup: false,
  layout: DuelLayout.Immersive,
  selfScore: 0,
  opponentScore: 0,
  simMinute: 0,
  phase: DuelPhase.FirstHalf,
  finished: false,
  result: null,
  role: null,

  start: (duelId, opponent, bet) =>
    set({ duelId, serverId: null, opponent, bet: bet ?? null, inSetup: true, selfScore: 0, opponentScore: 0, simMinute: 0, phase: DuelPhase.FirstHalf, finished: false, result: null, role: null }),

  startServerDuel: (detail, role) => {
    const opponent = role === 'host'
      ? (detail.guest ? dtoToProfile(detail.guest) : null)
      : dtoToProfile(detail.host);
    if (!opponent) return;
    set({
      duelId: detail.id,
      serverId: detail.id,
      opponent,
      bet: Number(detail.stake) || null,
      inSetup: false,
      selfScore: 0,
      opponentScore: 0,
      simMinute: 0,
      phase: DuelPhase.FirstHalf,
      finished: false,
      result: null,
      role,
    });
  },

  confirmSetup: () => {
    set({ inSetup: false });
    // Persist the duel (stake + lineup) when signed in; reconcile the wallet + keep the server id.
    if (!isBackendSession()) return;
    const { opponent, bet } = get();
    const fantasy = useFantasyStore.getState();
    const ownedCardIds = fantasy.squad
      .map((i) => fantasy.collection[i]?.ownedCardId)
      .filter(Boolean) as string[];
    if (!ownedCardIds.length) return;
    void duelService
      .create({
        stake: bet ?? 0,
        opponentName: opponent?.name,
        mode: bet ? 'Ranked' : 'Friendly',
        formation: fantasy.formation,
        ownedCardIds,
      })
      .then((res) => {
        set({ serverId: res.duel.id });
        useWalletStore.getState().hydrate(Number(res.balance));
      })
      .catch(() => {});
  },

  toggleLayout: () =>
    set((state) => ({
      layout: state.layout === DuelLayout.Immersive ? DuelLayout.Split : DuelLayout.Immersive,
    })),

  setScore: (selfScore, opponentScore) => set({ selfScore, opponentScore }),
  setMatchClock: (simMinute, phase) => set({ simMinute, phase }),

  finish: (result) => {
    set({ finished: true, result });
    const { serverId, selfScore, opponentScore, role } = get();
    if (!serverId || !isBackendSession()) return;

    // PvP guest: do NOT call settle — the server will push duel:settled back.
    if (role === 'guest') return;

    // PvP host OR vs-CPU: settle server-side.
    void duelService
      .settle(serverId, { hostScore: selfScore, guestScore: opponentScore, result: toServerResult(result) })
      .then((res) => useWalletStore.getState().hydrate(Number(res.balance)))
      .catch(() => {});
  },

  receiveSettlement: (hostScore, guestScore, guestResult) => {
    const result = serverResultToEnum(guestResult);
    set({ selfScore: guestScore, opponentScore: hostScore, finished: true, result });
    // Hydrate wallet after settlement (balance change on the server side).
    authService.me()
      .then((user) => useWalletStore.getState().hydrate(Number(user.balance)))
      .catch(() => {});
  },

  reset: () =>
    set({ duelId: null, serverId: null, opponent: null, bet: null, inSetup: false, selfScore: 0, opponentScore: 0, simMinute: 0, phase: DuelPhase.FirstHalf, finished: false, result: null, role: null }),
}));
