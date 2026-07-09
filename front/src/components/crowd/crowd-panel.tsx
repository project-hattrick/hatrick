'use client';

import { useState } from 'react';

import { Users, CaretDown } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { CrowdMessage } from './crowd-message';
import { CrowdComposer } from './crowd-composer';
import { useCrowdMessages } from '@/store/crowd.store';
import { formatCompact } from '@/lib/format';
import { cn } from '@/lib/utils';

const VIEWERS = 12_400;

/** Right-rail live crowd chat — collapsible header + short scroll list + composer. */
export function CrowdPanel({ fixtureId }: { fixtureId: number }) {
  const messages = useCrowdMessages();
  const [open, setOpen] = useState(true);

  return (
    <GlassPanel tone="surface" className="flex w-full flex-col overflow-hidden">
      <SectionHeader
        title="Live Crowd"
        className="border-b border-border bg-surface-1/60"
        action={
          <span className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" /> {formatCompact(VIEWERS)}
            </span>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? 'Hide crowd' : 'Show crowd'}
              className="grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
            >
              <CaretDown className={cn('size-4 transition-transform duration-300', !open && '-rotate-90')} />
            </button>
          </span>
        }
      />
      {open ? (
        <>
          <div className="custom-scrollbar flex max-h-[220px] flex-1 flex-col-reverse gap-4 overflow-y-auto p-4">
            {[...messages].reverse().map((message) => (
              <CrowdMessage key={message.id} message={message} />
            ))}
          </div>
          <div className="border-t border-border bg-surface-1/70">
            <CrowdComposer fixtureId={fixtureId} />
          </div>
        </>
      ) : null}
    </GlassPanel>
  );
}
