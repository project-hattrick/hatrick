'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { useSandboxStore } from '@/store/sandbox.store';

const BLUE = '#3b82f6';
const RED = '#ef4444';
const ACCENT = '#ffe066';

function Dot({ color }: { color: string }) {
  return <span className="size-3 rounded-full" style={{ backgroundColor: color }} />;
}

/** Top scoreboard + event ticker, mirrored from the engine HUD store. */
export function GameScoreboard() {
  const scoreBlue = useSandboxStore((s) => s.scoreBlue);
  const scoreRed = useSandboxStore((s) => s.scoreRed);
  const clock = useSandboxStore((s) => s.clock);
  const eventText = useSandboxStore((s) => s.eventText);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3.5 z-10 flex flex-col items-center gap-1">
      <GlassPanel radius="pill" className="flex items-center gap-3 px-4 py-2 text-sm font-bold">
        <span className="flex items-center gap-1.5">
          <Dot color={BLUE} /> BLUE
        </span>
        <span className="min-w-[60px] text-center text-xl tabular-nums" style={{ color: ACCENT }}>
          {scoreBlue} - {scoreRed}
        </span>
        <span className="flex items-center gap-1.5">
          RED <Dot color={RED} />
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">{clock}</span>
      </GlassPanel>
      <div className="min-h-4 text-xs font-medium" style={{ color: ACCENT }}>
        {eventText}
      </div>
    </div>
  );
}
