import { GameBackground } from '@/components/game/game-background';
import { MatchStateOverlay } from '@/components/live/match-state-overlay';
import { PersonaHeroBackdrop } from '@/components/game/real-gk/persona-hero-backdrop';
import { HERO_CHECKPOINT, RuntimeKind, getCheckpointMeta } from '@/game/checkpoints/registry';

/** Live match playing behind the hero — the engine (picked by runtime) as an ambient backdrop. */
export function MatchBackground({ scrim = true, bridgeHud = false }: { scrim?: boolean; bridgeHud?: boolean }) {
  const isRealGk = getCheckpointMeta(HERO_CHECKPOINT).runtime === RuntimeKind.RealGk;
  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      {isRealGk ? (
        <PersonaHeroBackdrop className="absolute inset-0" bridgeHud={bridgeHud} />
      ) : (
        <GameBackground checkpoint={HERO_CHECKPOINT} className="absolute inset-0" />
      )}
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
