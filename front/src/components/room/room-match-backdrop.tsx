import { MatchStateOverlay } from '@/components/live/match-state-overlay';
import { RoomPersonaBackdrop } from './room-persona-backdrop';

/**
 * Room drop-in for `MatchBackground`: same wrappers (bg + hero-ambient + structural-state banner +
 * optional scrim), but the pitch is the persona-cast "new model" driven by the room's fixture teams.
 * Rooms are always RealGk, so there's no runtime check — it always mounts the styled backdrop.
 */
export function RoomMatchBackdrop({
  scrim = true,
  bridgeHud = false,
  feedRadar = false,
}: {
  scrim?: boolean;
  bridgeHud?: boolean;
  /** True only on the persistent ambient engine — the single source for the mini-pitch radar. */
  feedRadar?: boolean;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      <RoomPersonaBackdrop className="absolute inset-0" bridgeHud={bridgeHud} feedRadar={feedRadar} />
      <div className="hero-ambient pointer-events-none absolute inset-0" />
      {/* Structural-state banner — freezes the pitch at half-time and locks on the winner at full-time. */}
      <MatchStateOverlay />
      {scrim ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/55" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/70 via-background/25 to-transparent" />
        </>
      ) : null}
    </div>
  );
}
