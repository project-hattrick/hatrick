'use client';

import { HoloPlayerCard } from '@/components/store/holo-player-card';
import type { PackCard } from '@/config/pack-pool.config';

/** Final step — the best pull as a hero image, with a centered wrap-up paragraph below. */
export function DoneStep({ collection, squadCount }: { collection: PackCard[]; squadCount: number }) {
  const best = collection.reduce<PackCard | null>(
    (top, card) => ((card.number ?? 0) > (top?.number ?? 0) ? card : top),
    null,
  );

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      {best && (
        <div className="drop-shadow-[0_18px_40px_rgb(0_0_0/0.55)]">
          <HoloPlayerCard
            number={best.number}
            flag={best.flag}
            stats={best.stats}
            portraitSrc={best.portraitSrc}
            holoColors={best.holoColors}
            surfaceShine
            width={184}
          />
        </div>
      )}

      <p className="text-lead mx-auto max-w-sm text-muted-foreground">
        Your squad is ready. You&apos;re starting with{' '}
        <span className="font-semibold text-foreground">{collection.length} cards</span> and a locked{' '}
        <span className="font-semibold text-foreground">{squadCount}-player</span> XI
        {best ? (
          <>
            , led by <span className="font-semibold text-foreground">{best.name}</span> at {best.number} OVR
          </>
        ) : null}
        . Take them onto the pitch.
      </p>
    </div>
  );
}
