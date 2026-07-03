import Image from 'next/image';

import { Flag } from '@/components/common/flag';
import { squad } from '@/config/squad.config';

/** Minimalist roster strip — compact cards (portrait + name), a complement to the pitch above. */
export function SquadMiniStrip() {
  return (
    <div className="custom-scrollbar flex gap-2.5 overflow-x-auto pb-2">
      {squad.map((player) => (
        <div
          key={player.id}
          className="flex w-[100px] shrink-0 flex-col overflow-hidden rounded-xl border border-white/8 bg-surface-2"
        >
          <div className="relative h-[76px] bg-gradient-to-b from-surface-3 to-surface-1">
            <span className="absolute top-1 left-2 z-10 font-talero text-lg text-neon">{player.number}</span>
            <Image
              src={player.portraitSrc}
              alt={player.name}
              fill
              sizes="100px"
              className="object-contain object-bottom pt-1"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="flex flex-col gap-0.5 p-2">
            <span className="truncate text-[11px] leading-tight font-bold text-white">{player.name}</span>
            <span className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground">
              <Flag code={player.code} className="text-[10px]" />
              <span className="truncate">{player.position}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
