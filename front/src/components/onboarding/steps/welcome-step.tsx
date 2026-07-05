'use client';

import { Button } from '@/components/ui/button';
import { Gift, SoccerBall, Sword, Sparkle } from '@/components/common/icons';

const PERKS = [
  { icon: Gift, title: 'A free Starter Pack', blurb: '5 player cards to kick off your collection.' },
  { icon: SoccerBall, title: 'Build your XI', blurb: 'Line up your best pulls into a starting eleven.' },
  { icon: Sword, title: 'Duel your friends', blurb: 'Take your squad into 1v1 matches on real data.' },
];

/** Opening step — sets expectations and promises an instant reward to keep the new player moving. */
export function WelcomeStep({ name, onNext }: { name?: string; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-neon/15 text-neon">
          <Sparkle className="size-7" weight="fill" />
        </span>
        <p className="text-lead">
          Welcome{name ? `, ${name}` : ''} — you&apos;re in. Let&apos;s set you up in under a minute and claim
          your first reward.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {PERKS.map(({ icon: Icon, title, blurb }) => (
          <li key={title} className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2/60 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-3 text-neon">
              <Icon className="size-5" weight="fill" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold">{title}</span>
              <span className="text-micro text-muted-foreground">{blurb}</span>
            </div>
          </li>
        ))}
      </ul>

      <Button size="lg" shape="pill" className="w-full gap-2" onClick={onNext}>
        <Gift className="size-4" weight="fill" />
        Claim my free pack
      </Button>
    </div>
  );
}
