import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { lookup } from '@/lib/lookup';
import { X, ChatCircle, type Icon } from '@/components/common/icons';
import { Flag } from '@/components/common/flag';
import { fifaToIso } from '@/lib/country';
import { teamSideConfig, teamSideFallback } from '@/config/team-side.config';
import { CrowdSource } from '@/enums/crowd-source.enum';
import type { CrowdMessage as CrowdMessageModel } from '@/types/crowd';

interface SourceMeta {
  icon: Icon;
  className: string;
}

// Branding badge per source — X (Twitter) vs in-app community chat.
const sourceConfig: Record<CrowdSource, SourceMeta> = {
  [CrowdSource.Twitter]: { icon: X, className: 'bg-black text-white' },
  [CrowdSource.Community]: { icon: ChatCircle, className: 'bg-surface-3 text-muted-foreground' },
};
const sourceFallback = sourceConfig[CrowdSource.Community];

/** A single crowd chat message row (flag + avatar + country + source badge). */
export function CrowdMessage({ message }: { message: CrowdMessageModel }) {
  const meta = lookup(teamSideConfig, message.side, teamSideFallback);
  const source = lookup(sourceConfig, message.source, sourceFallback);
  const SourceIcon = source.icon;

  return (
    <div className="flex animate-in gap-3.5 fade-in slide-in-from-bottom-2 duration-300">
      <Avatar name={message.author} src={message.avatar} className="size-[30px]" />
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Flag code={fifaToIso(message.countryCode)} className="text-sm" />
            <span className={cn('truncate text-xs font-bold', meta.tone)}>{message.author}</span>
            <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-muted-foreground uppercase">
              {message.countryCode}
            </span>
            <span className={cn('grid size-[15px] shrink-0 place-items-center rounded', source.className)}>
              <SourceIcon weight="bold" className="size-2.5" />
            </span>
          </div>
          <span className="shrink-0 text-micro font-medium text-muted-foreground">{message.ageLabel}</span>
        </div>
        <span className="mt-1 text-sm text-foreground/90">{message.text}</span>
      </div>
    </div>
  );
}
