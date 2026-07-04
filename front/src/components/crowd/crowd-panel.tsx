'use client';

import { Users } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { CrowdMessage } from './crowd-message';
import { CrowdComposer } from './crowd-composer';
import { useCrowdMessages } from '@/store/crowd.store';
import { formatCompact } from '@/lib/format';

const VIEWERS = 12_400;

/** Right-rail live crowd chat (header + scroll list + composer). */
export function CrowdPanel({ fixtureId }: { fixtureId: number }) {
  const messages = useCrowdMessages();

  return (
    <GlassPanel tone="surface" className="flex h-full w-full flex-col overflow-hidden">
      <SectionHeader
        title="Live Crowd"
        className="border-b border-border bg-surface-1/60"
        action={
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Users className="size-3.5" /> {formatCompact(VIEWERS)}
          </span>
        }
      />
      <div className="custom-scrollbar flex flex-1 flex-col-reverse gap-5 overflow-y-auto p-5">
        {[...messages].reverse().map((message) => (
          <CrowdMessage key={message.id} message={message} />
        ))}
      </div>
      <div className="border-t border-border bg-surface-1/70">
        <CrowdComposer fixtureId={fixtureId} />
      </div>
    </GlassPanel>
  );
}
