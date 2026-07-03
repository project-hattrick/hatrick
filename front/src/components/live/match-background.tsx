import { GameBackground } from '@/components/game/game-background';
import { RealGkBackground } from '@/components/game/real-gk/real-gk-background';
import { HERO_CHECKPOINT, RuntimeKind, getCheckpointMeta } from '@/game/checkpoints/registry';

/** Live match playing behind the hero — the engine (picked by runtime) as an ambient backdrop. */
export function MatchBackground({ scrim = true }: { scrim?: boolean }) {
  const isRealGk = getCheckpointMeta(HERO_CHECKPOINT).runtime === RuntimeKind.RealGk;
  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      {isRealGk ? (
        <RealGkBackground className="absolute inset-0" />
      ) : (
        <GameBackground checkpoint={HERO_CHECKPOINT} className="absolute inset-0" />
      )}
      <div className="hero-ambient pointer-events-none absolute inset-0" />
      {scrim ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/55 via-background/15 to-background/90" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-background/95 via-background/55 to-transparent" />
        </>
      ) : null}
    </div>
  );
}
