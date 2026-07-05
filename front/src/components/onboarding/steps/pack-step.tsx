'use client';

import { Button } from '@/components/ui/button';
import { Gift, Sparkle } from '@/components/common/icons';
import styles from './pack-step.module.css';

/**
 * Reward step — a sealed pack teaser. The button hands off to the cinematic PackOpening
 * overlay (owned by the dialog); the pull result lands the player straight into squad-building.
 */
export function PackStep({ onOpenPack }: { onOpenPack: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      <div className={styles.pack}>
        <div className={styles.shine} />
        <Sparkle className="size-9 text-black/70" weight="fill" />
        <span className="text-xs font-black tracking-[0.3em] text-black/70 uppercase">Starter Pack</span>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-lead font-semibold">Your welcome pack is ready</p>
        <p className="text-micro text-muted-foreground">
          5 player cards on the house. Tear it open and see who you pulled.
        </p>
      </div>

      <Button size="lg" shape="pill" className="w-full gap-2" onClick={onOpenPack}>
        <Gift className="size-4" weight="fill" />
        Open pack
      </Button>
    </div>
  );
}
