'use client';

import { useState } from 'react';

import { Users, CaretDown } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { CrowdMessage } from './crowd-message';
import { CrowdComposer } from './crowd-composer';
import { useCrowdMessages } from '@/store/crowd.store';
import { useViewerCount } from '@/store/viewers.store';
import { formatCompact } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Right-rail live crowd chat. By default it fills the FULL HEIGHT of its rail (flex-1); the caret just
 * toggles it between full and hidden (header only) — no in-between size.
 */
export function CrowdPanel({ fixtureId }: { fixtureId: number }) {
  const messages = useCrowdMessages();
  const viewers = useViewerCount();
  const [open, setOpen] = useState(true);

  return (
    <GlassPanel tone="surface" className={cn('flex w-full flex-col overflow-hidden', open && 'min-h-0 flex-1')}>
      <SectionHeader
        title="Live Crowd"
        className="border-b border-border bg-surface-1/60"
        action={
          <span className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" /> {formatCompact(viewers)}
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
          <div data-lenis-prevent className="custom-scrollbar flex min-h-0 flex-1 flex-col-reverse gap-4 overflow-y-auto overflow-x-hidden p-4">
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
