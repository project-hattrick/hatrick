import { GlassPanel } from '@/components/common/glass-panel';
import { cn } from '@/lib/utils';
import { achievements } from '@/config/profile-mock';

/** Featured achievement badges — blurred teaser until the achievements system ships. */
export function ProfileAchievements() {
  return (
    <GlassPanel tone="dark" radius="xl" className="flex-1 p-5">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-sm font-bold text-foreground">Featured achievements</h2>
        <span className="text-micro rounded-full border border-neon/30 bg-neon/10 px-2 py-0.5 font-semibold text-neon">
          Coming soon
        </span>
      </div>
      <div aria-hidden className="pointer-events-none flex flex-wrap gap-6 opacity-50 blur-[6px] select-none">
        {achievements.map((badge) => {
          const Icon = badge.icon;
          return (
            <div key={badge.label} className="flex flex-col items-center gap-2">
              <span className={cn('grid size-12 place-items-center rounded-xl ring-1', badge.chip, badge.text)}>
                <Icon className="size-6" weight="fill" />
              </span>
              <span className="text-micro text-center text-muted-foreground">{badge.label}</span>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
