'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

import { GlassPanel } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { heroMatch } from '@/config/match-dashboard.config';

const { days, hours, minutes, seconds } = heroMatch.countdown;
const INITIAL = ((days * 24 + hours) * 60 + minutes) * 60 + seconds;

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-2xl font-bold tabular-nums text-white sm:text-[28px]">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] font-semibold tracking-wider text-white/60 uppercase">{label}</span>
    </div>
  );
}

/** Featured match hero — two pixel-art players over a pitch, with a kickoff countdown. */
export function MatchHeroCard() {
  const [remaining, setRemaining] = useState(INITIAL);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = window.setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearInterval(id);
  }, [remaining]);

  const d = Math.floor(remaining / 86400);
  const h = Math.floor((remaining % 86400) / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  return (
    <GlassPanel tone="surface" radius="xl" className="relative h-[190px] overflow-hidden p-0">
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,#1b3a24_0%,#0e2116_55%,#0a0d0a_100%)]" />

      <Image
        src={heroMatch.home.portraitSrc}
        alt={heroMatch.home.name}
        width={150}
        height={190}
        className="absolute bottom-0 left-0 h-full w-auto object-contain object-left-bottom"
        style={{ imageRendering: 'pixelated' }}
      />
      <Image
        src={heroMatch.away.portraitSrc}
        alt={heroMatch.away.name}
        width={150}
        height={190}
        className="absolute right-0 bottom-0 h-full w-auto object-contain object-right-bottom"
        style={{ imageRendering: 'pixelated' }}
      />

      <div className="relative flex h-full flex-col items-center justify-center gap-1 text-center">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Flag code={heroMatch.home.code} className="text-sm" />
          <span className="text-xs tracking-wider text-white/70 uppercase">
            {heroMatch.home.name} vs {heroMatch.away.name}
          </span>
          <Flag code={heroMatch.away.code} className="text-sm" />
        </div>
        <div className="text-[11px] text-white/50">{heroMatch.label}</div>

        <div className="mt-2 flex items-start gap-3 rounded-xl bg-black/35 px-4 py-2 backdrop-blur-sm">
          <CountUnit value={d} label="Days" />
          <span className="pt-1 text-xl font-bold text-white/40">:</span>
          <CountUnit value={h} label="Hours" />
          <span className="pt-1 text-xl font-bold text-white/40">:</span>
          <CountUnit value={m} label="Minutes" />
          <span className="pt-1 text-xl font-bold text-white/40">:</span>
          <CountUnit value={s} label="Seconds" />
        </div>
      </div>
    </GlassPanel>
  );
}
