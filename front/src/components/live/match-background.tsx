import { MatchStateOverlay } from '@/components/live/match-state-overlay';
import { PersonaHeroBackdrop } from '@/components/game/real-gk/persona-hero-backdrop';

/** Live match playing behind the hero — the Real Match GK engine as an ambient backdrop. */
export function MatchBackground({ scrim = true, bridgeHud = false }: { scrim?: boolean; bridgeHud?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      <PersonaHeroBackdrop className="absolute inset-0" bridgeHud={bridgeHud} />
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
