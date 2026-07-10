import Image from 'next/image';
import Link from 'next/link';

import { Flag } from '@/components/common/flag';
import { UserPlus } from '@/components/common/icons';
import { squad } from '@/config/squad.config';
import { AppMode } from '@/enums/app-mode.enum';

/** Fixed collection size — the roster fills these slots, any leftover renders as an empty state. */
const SQUAD_SLOTS = 12;

/** Roster laid over the full row width as a fixed set of slots (filled cards + empty placeholders). */
export function SquadMiniStrip() {
  const slots = Array.from({ length: SQUAD_SLOTS }, (_, index) => squad[index] ?? null);

  return (
    // Mobile: edge-to-edge swipe carousel (bleeds past the page padding); md+: the original even grid.
    <div className="custom-scrollbar -mx-6 flex snap-x gap-2.5 overflow-x-auto px-6 pb-1 md:mx-0 md:grid md:w-full md:auto-cols-fr md:grid-flow-col md:overflow-visible md:px-0 md:pb-0">
      {slots.map((player, index) =>
        player ? (
          <div
            key={player.id}
            className="flex w-[104px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-border bg-surface-2 md:w-auto"
          >
            <div className="relative aspect-[100/76] bg-gradient-to-b from-surface-3 to-surface-1">
              <span className="absolute top-1 left-2 z-10 font-talero text-lg text-neon">{player.number}</span>
              <Image
                src={player.portraitSrc}
                alt={player.name}
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                className="object-contain object-bottom pt-1"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="flex flex-col gap-0.5 p-2">
              <span className="truncate text-xs leading-tight font-bold text-white">{player.name}</span>
              <span className="flex items-center gap-1 text-micro font-semibold text-muted-foreground">
                <Flag code={player.code} className="text-micro" />
                <span className="truncate">{player.position}</span>
              </span>
            </div>
          </div>
        ) : (
          <Link
            key={`empty-${index}`}
            href={`/${AppMode.Fantasy}`}
            className="group flex w-[104px] shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-surface-1/40 p-2 text-muted-foreground transition-colors hover:border-neon/40 hover:text-neon md:w-auto"
          >
            <UserPlus className="text-2xl opacity-70 transition-opacity group-hover:opacity-100" />
            <span className="text-micro font-semibold">Empty slot</span>
          </Link>
        ),
      )}
    </div>
  );
}
