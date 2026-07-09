import { create } from 'zustand';
import type { PlayerProfile } from '@/config/duelists.config';
import { DuelResult } from '@/enums/duel-result.enum';
import { DuelLayout } from '@/enums/duel-layout.enum';
import { DuelPhase } from '@/enums/duel-phase.enum';
import { duelService, type DuelResultValue } from '@/services/fantasy.service';
import { isBackendSession } from '@/services/session-mode';
import { useWalletStore } from '@/store/wallet.store';
import { useFantasyStore } from '@/store/fantasy.store';

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
  /** Begin a duel against a chosen opponent — opens on the XI/formation setup step. */
  start: (duelId: string, opponent: PlayerProfile, bet?: number) => void;
  /** Lock the lineup and enter the arena. */
  confirmSetup: () => void;
  /** Flip between the immersive and split-view arena layouts. */
  toggleLayout: () => void;
  /** Push the live scoreline from the duel director (simulator-authoritative). */
  setScore: (selfScore: number, opponentScore: number) => void;
  /** Push the simulated clock + phase from the duel director. */
  setMatchClock: (simMinute: number, phase: DuelPhase) => void;
  /** Freeze the final result. */
  finish: (result: DuelResult) => void;
  reset: () => void;
}

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
  start: (duelId, opponent, bet) =>
    set({ duelId, serverId: null, opponent, bet: bet ?? null, inSetup: true, selfScore: 0, opponentScore: 0, simMinute: 0, phase: DuelPhase.FirstHalf, finished: false, result: null }),
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
    const { serverId, selfScore, opponentScore } = get();
    if (!serverId || !isBackendSession()) return;
    void duelService
      .settle(serverId, { hostScore: selfScore, guestScore: opponentScore, result: toServerResult(result) })
      .then((res) => useWalletStore.getState().hydrate(Number(res.balance)))
      .catch(() => {});
  },
  reset: () =>
    set({ duelId: null, serverId: null, opponent: null, bet: null, inSetup: false, selfScore: 0, opponentScore: 0, simMinute: 0, phase: DuelPhase.FirstHalf, finished: false, result: null }),
}));
