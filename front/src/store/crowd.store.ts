import { create } from 'zustand';
import type { CrowdMessage } from '@/types/crowd';

interface CrowdStore {
  messages: CrowdMessage[];
  add: (message: CrowdMessage) => void;
  seed: (messages: CrowdMessage[]) => void;
}

/** Crowd chat feeding speech-balloons over the stands. */
export const useCrowdStore = create<CrowdStore>((set) => ({
  messages: [],
  add: (message) => set((state) => ({ messages: [...state.messages, message].slice(-50) })),
  seed: (messages) => set({ messages }),
}));

export const useCrowdMessages = () => useCrowdStore((state) => state.messages);
