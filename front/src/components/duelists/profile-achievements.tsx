import { GlassPanel } from '@/components/common/glass-panel';
import { cn } from '@/lib/utils';
import { achievements } from '@/config/profile-mock';

/** Featured achievement badges row. */
export function ProfileAchievements() {
  return (
    <GlassPanel tone="dark" radius="xl" className="flex-1 p-5">
      <h2 className="mb-4 text-sm font-bold text-foreground">Featured achievements</h2>
      <div className="flex flex-wrap gap-6">
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
