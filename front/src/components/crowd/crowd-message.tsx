import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { lookup } from '@/lib/lookup';
import { teamSideConfig, teamSideFallback } from '@/config/team-side.config';
import type { CrowdMessage as CrowdMessageModel } from '@/types/crowd';

/** A single crowd chat message row (flag + avatar + country tag). */
export function CrowdMessage({ message }: { message: CrowdMessageModel }) {
  const meta = lookup(teamSideConfig, message.side, teamSideFallback);

  return (
    <div className="flex animate-in gap-3.5 fade-in slide-in-from-bottom-2 duration-300">
      <Avatar name={message.author} src={message.avatar} className="size-[30px]" />
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm leading-none">{message.flag}</span>
            <span className={cn('text-xs font-bold', meta.tone)}>{message.author}</span>
            <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-muted-foreground uppercase">
              {message.countryCode}
            </span>
          </div>
          <span className="text-[9px] font-medium text-muted-foreground">{message.ageLabel}</span>
        </div>
        <span className="mt-1 text-[13px] text-foreground/90">{message.text}</span>
      </div>
    </div>
  );
}
