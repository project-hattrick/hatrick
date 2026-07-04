import { Trophy } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionLink } from './section-link';
import { formatThousands } from '@/lib/format';
import { userPoints } from '@/config/home.config';

/** Overview card: the player's points balance + progress to next reward. */
function PointsCard() {
  const progress = userPoints.total / userPoints.nextReward;

  return (
    <GlassPanel tone="surface" className="flex h-full flex-col">
      <SectionHeader
        title="Your points"
        action={<span className="text-xs font-semibold text-neon">{userPoints.tier}</span>}
      />
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-neon" />
          <span className="text-3xl font-bold tracking-tight">{formatThousands(userPoints.total)}</span>
          <span className="pb-1 text-xs text-muted-foreground">pts</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Next reward</span>
            <span>
              {formatThousands(userPoints.rewardFrom)} / {formatThousands(userPoints.nextReward)}
            </span>
          </div>
          <ProgressBar value={progress} label="Progress to next reward" />
        </div>
        <SectionLink href="/store" label="Rewards store" className="mt-auto self-start" />
      </div>
    </GlassPanel>
  );
}

export { PointsCard };
