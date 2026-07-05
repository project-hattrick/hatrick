'use client';

import Image from 'next/image';

import { HoloPlayerCard } from '@/components/store/holo-player-card';
import { userCards, statOrder } from '@/config/fantasy-cards.config';
import { cn } from '@/lib/utils';
import styles from './pack-step.module.css';

// A real card as the teaser hero (Mbappé) — the same holo card the pack pulls.
const HERO = userCards[1];
const HERO_STATS = statOrder.map(([label, key]) => ({ label, value: HERO.stats[key] }));

/**
 * Reward step — the real holo card the pack can drop, over a lit pitch with peeking backs.
 * Presentational only; the flow footer owns the "Open pack" action.
 */
export function PackStep() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className={styles.stage}>
        <div className={styles.fan}>
          <div className={cn(styles.back, styles.backLeft)}>
            <Image src="/cards/fade-logo.png" alt="" width={48} height={48} className="opacity-45" />
          </div>
          <div className={cn(styles.back, styles.backRight)}>
            <Image src="/cards/fade-logo.png" alt="" width={48} height={48} className="opacity-45" />
          </div>
          <div className={styles.hero}>
            <HoloPlayerCard
              number={HERO.rating}
              flag={HERO.flag}
              stats={HERO_STATS}
              portraitSrc={HERO.portraitSrc}
              holoColors={HERO.holoColors}
              width={172}
            />
          </div>
        </div>
      </div>

      <p className="text-caption text-center text-muted-foreground">
        Five real cards inside — the best land straight in your XI.
      </p>
    </div>
  );
}
