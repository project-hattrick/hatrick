import { create } from 'zustand';
import { AppMode } from '@/enums/app-mode.enum';

interface HomeEntryStore {
  activeMode: AppMode | null;
  matchmakingOpen: boolean;
  openMode: (mode: AppMode) => void;
  closeMode: () => void;
  startMatchmaking: () => void;
  setMatchmakingOpen: (open: boolean) => void;
}

export const useHomeEntryStore = create<HomeEntryStore>((set) => ({
  activeMode: null,
  matchmakingOpen: false,
  openMode: (activeMode) => set({ activeMode }),
  closeMode: () => set({ activeMode: null }),
  startMatchmaking: () => set({ activeMode: null, matchmakingOpen: true }),
  setMatchmakingOpen: (matchmakingOpen) => set({ matchmakingOpen }),
}));
