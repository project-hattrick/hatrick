import { TrendingUp } from 'lucide-react';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { LiveBadge } from '@/components/common/live-badge';
import { Sparkline } from '@/components/common/sparkline';
import { SectionLink } from './section-link';
import { formatCompact } from '@/lib/format';
import { liveNow } from '@/config/home.config';

/** Overview card: online users with a sparkline trend. */
function LiveNowCard() {
  return (
    <GlassPanel tone="surface" className="flex flex-col">
      <SectionHeader title="Live now" action={<LiveBadge className="text-[11px]" />} />
      <div className="flex flex-col gap-3 px-4 pb-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold tracking-tight">{formatCompact(liveNow.usersOnline)}</div>
            <div className="text-xs text-muted-foreground">users online</div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-neon">
            <TrendingUp className="size-3.5" />
            {liveNow.changePct}%
          </span>
        </div>
        <Sparkline values={liveNow.trend} />
        <SectionLink href="/live" label="View all matches" className="self-start" />
      </div>
    </GlassPanel>
  );
}

export { LiveNowCard };
