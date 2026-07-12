import { create } from 'zustand';
import type { RealGkRadar } from '@/game/realgk/types';

interface RoomRadarState {
  /** Latest live positions sampled from the room's match engine (null before it boots / after teardown). */
  radar: RealGkRadar | null;
  setRadar: (radar: RealGkRadar | null) => void;
}

/**
 * Bridge between the room's ambient match engine and the mini-pitch radar. The backdrop samples the
 * engine handle a few times a second and writes here; `RoomMiniPitch` reads it so the 2D dots + ball
 * mirror the actual on-pitch positions instead of a formation stand-in.
 */
export const useRoomRadarStore = create<RoomRadarState>((set) => ({
  radar: null,
  setRadar: (radar) => set({ radar }),
}));
