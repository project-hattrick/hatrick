import { create } from 'zustand';

import { backendEnabled } from '@/services/session-mode';

/** Live viewer count fallback for mock/offline mode — a believable full-house number. */
export const MOCK_VIEWERS = 12_400;

interface ViewersStore {
  /** Real connected-socket count from `global:presence`; null until the first snapshot. */
  count: number | null;
  setCount: (count: number) => void;
}

/** Live viewer count fed by the `global:presence` broadcast (real mode only). */
export const useViewersStore = create<ViewersStore>((set) => ({
  count: null,
  setCount: (count) => set({ count }),
}));

/**
 * Live viewer count for the UI: the REAL connected-socket count when backed by the
 * server, the mock house number when running offline (USE_MOCK). Never invented in
 * real mode — reflects however many sockets are actually watching.
 */
export function useViewerCount(): number {
  const count = useViewersStore((s) => s.count);
  if (!backendEnabled) return MOCK_VIEWERS;
  return count ?? 0;
}
