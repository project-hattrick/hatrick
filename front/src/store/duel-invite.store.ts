import { create } from 'zustand';

/** Payload pushed by the server when the signed-in user receives a PvP challenge. */
export interface IncomingDuelInvite {
  duelId: string;
  hostId: string;
  hostName: string;
  stake: number;
}

interface DuelInviteStore {
  /** Active incoming invite, or null when none pending. */
  invite: IncomingDuelInvite | null;
  setInvite: (invite: IncomingDuelInvite) => void;
  clearInvite: () => void;
}

/** Ephemeral store that holds the most recent incoming PvP duel invite. */
export const useDuelInviteStore = create<DuelInviteStore>((set) => ({
  invite: null,
  setInvite: (invite) => set({ invite }),
  clearInvite: () => set({ invite: null }),
}));
