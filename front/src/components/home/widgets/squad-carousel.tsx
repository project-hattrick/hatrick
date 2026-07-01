'use client';

import * as React from 'react';
import { CaretLeft, CaretRight } from '@/components/common/icons';
import { cn } from '@/lib/utils';
import { PlayerRosterCard } from './player-roster-card';
import type { SquadPlayer } from '@/config/squad.config';

const STEP = 304;

function Arrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? CaretLeft : CaretRight;
  return (
    <button
      type="button"
      aria-label={side === 'left' ? 'Previous players' : 'Next players'}
      onClick={onClick}
      className={cn(
        'absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-border/60 bg-surface-1/90 text-foreground shadow-xl backdrop-blur transition hover:border-neon/40 hover:text-neon',
        side === 'left' ? 'left-2' : 'right-2',
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}

/** Horizontally scrollable row of roster cards with prev / next controls. */
export function SquadCarousel({ players }: { players: SquadPlayer[] }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => ref.current?.scrollBy({ left: direction * STEP, behavior: 'smooth' });

  return (
    <div className="relative">
      <div ref={ref} className="custom-scrollbar flex gap-4 overflow-x-auto pb-3">
        {players.map((player) => (
          <PlayerRosterCard key={player.id} player={player} />
        ))}
      </div>
      {players.length > 2 ? (
        <>
          <Arrow side="left" onClick={() => scroll(-1)} />
          <Arrow side="right" onClick={() => scroll(1)} />
        </>
      ) : null}
    </div>
  );
}
