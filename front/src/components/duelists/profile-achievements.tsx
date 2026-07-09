import { GlassPanel } from '@/components/common/glass-panel';
import { cn } from '@/lib/utils';
import { achievements } from '@/config/profile-mock';

/** Featured achievement badges — blurred teaser until the achievements system ships. */
export function ProfileAchievements() {
  return (
    <GlassPanel tone="dark" radius="xl" className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-foreground">Featured achievements</h2>
        <span className="text-micro rounded-full border border-neon/30 bg-neon/10 px-2 py-0.5 font-semibold text-neon">
          Coming soon
        </span>
      </div>
      <div aria-hidden className="pointer-events-none flex shrink-0 gap-3 opacity-50 blur-[5px] select-none">
        {achievements.map((badge) => {
          const Icon = badge.icon;
          return (
            <span
              key={badge.label}
              className={cn('grid size-9 place-items-center rounded-lg ring-1', badge.chip, badge.text)}
            >
              <Icon className="size-5" weight="fill" />
            </span>
          );
        })}
      </div>
    </GlassPanel>
  );
}
