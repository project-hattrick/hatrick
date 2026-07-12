import { RoomMatchBackdrop } from '@/components/room/room-match-backdrop';

/**
 * Match stage behind the hero; absolute so it scrolls away with the hero (no curtain). The landing
 * hero now runs the room's per-team "new model" pitch as its ambient backdrop.
 * - bridgeHud: only the hero backdrop feeds the store, so cinematic beats hide the hero chrome.
 * - feedRadar: this is the single persistent engine, so it samples the live positions the mini-pitch reads.
 */
export function ParallaxStage() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <RoomMatchBackdrop bridgeHud feedRadar />
    </div>
  );
}
