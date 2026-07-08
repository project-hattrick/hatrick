'use client';

import { useState } from 'react';
import Image from 'next/image';

import { Check, TrendUp } from '@/components/common/icons';
import { talero } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import type { Formation } from '@/config/formation.config';
import type { PackCard } from '@/config/pack-pool.config';

/** Strongest pulls first, capped at an XI, keeping original collection indices for `squad`. */
export function pickStartingXI(collection: PackCard[]): { card: PackCard; index: number }[] {
  return collection
    .map((card, index) => ({ card, index }))
    .sort((a, b) => (b.card.number ?? 0) - (a.card.number ?? 0))
    .slice(0, 11);
}

/** Circular player token on the pitch — portrait avatar + rating, draggable to swap. */
function PlayerToken({
  card,
  label,
  x,
  y,
  selected,
  dragging,
  onClick,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  card?: PackCard;
  label: string;
  x: number;
  y: number;
  selected: boolean;
  dragging: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
}) {
  return (
    <div
      draggable={Boolean(card)}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      style={{ left: `${x}%`, top: `${y}%` }}
      className={cn(
        'absolute z-10 flex -translate-x-1/2 -translate-y-1/2 cursor-grab flex-col items-center gap-1 transition active:cursor-grabbing',
        dragging && 'opacity-40',
        selected && 'scale-110',
      )}
    >
      <span className="relative">
        <span
          className={cn(
            'grid size-12 place-items-end overflow-hidden rounded-full border bg-gradient-to-b from-surface-3 to-surface-deep shadow-e3 transition',
            selected ? 'border-neon ring-2 ring-neon' : 'border-white/20',
          )}
        >
          {card?.portraitSrc ? (
            <Image
              src={card.portraitSrc}
              alt={card.name}
              width={48}
              height={48}
              className="translate-y-[8%] scale-125 object-contain object-bottom"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : null}
        </span>
        {card && (
          <span className="absolute -right-1.5 -bottom-1 rounded-full border border-overlay/60 bg-surface-deep px-1.5 py-0.5 font-mono text-micro font-bold tabular-nums text-neon shadow">
            {card.number}
          </span>
        )}
      </span>
      <span className="max-w-[72px] truncate rounded bg-overlay/55 px-1.5 py-0.5 text-eyebrow text-white/90 backdrop-blur-sm">
        {card ? card.name : label}
      </span>
    </div>
  );
}

/**
 * Formation editor — the XI as circular tokens on a pitch (drag to swap, or tap two), with the
 * shape presets in a side rail. State (order + shape) lives in the onboarding controller.
 */
export function SquadStep({
  collection,
  order,
  formations,
  formationIndex,
  formation,
  onSwap,
  onSelectFormation,
}: {
  collection: PackCard[];
  order: number[];
  formations: Formation[];
  formationIndex: number;
  formation: Formation;
  onSwap: (a: number, b: number) => void;
  onSelectFormation: (index: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  const tap = (slot: number) => {
    if (selected === null) setSelected(slot);
    else if (selected === slot) setSelected(null);
    else {
      onSwap(selected, slot);
      setSelected(null);
    }
  };

  const dropOn = (slot: number) => {
    if (dragFrom !== null && dragFrom !== slot) onSwap(dragFrom, slot);
    setDragFrom(null);
    setSelected(null);
  };

  const cards = order.map((idx) => collection[idx]).filter(Boolean) as PackCard[];
  const strength = cards.length
    ? Math.round(cards.reduce((sum, card) => sum + (card.number ?? 0), 0) / cards.length)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-[1.5fr_1fr] md:items-stretch">
      {/* Pitch */}
      <div className="pitch-stripes-v relative h-[380px] w-full overflow-hidden rounded-2xl border border-white/10 md:h-[460px]">
        <div className="pointer-events-none absolute inset-3 rounded-lg border border-white/10" />
        <div className="pointer-events-none absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />

        <span className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-overlay/45 px-2.5 py-1 text-micro font-bold text-neon backdrop-blur-sm">
          <TrendUp className="size-3.5" weight="bold" />
          {strength} OVR
        </span>

        {formation.slots.map((slot, i) => (
          <PlayerToken
            key={i}
            card={collection[order[i]]}
            label={slot.label}
            x={slot.x}
            y={slot.y}
            selected={selected === i}
            dragging={dragFrom === i}
            onClick={() => tap(i)}
            onDragStart={() => setDragFrom(i)}
            onDragEnd={() => setDragFrom(null)}
            onDrop={() => dropOn(i)}
          />
        ))}
      </div>

      {/* Presets rail (right, outside the pitch) */}
      <div className="flex flex-col gap-2">
        <p className="text-eyebrow text-muted-foreground">Formation</p>
        {formations.map((f, i) => {
          const active = i === formationIndex;
          return (
            <button
              key={f.shape}
              type="button"
              onClick={() => onSelectFormation(i)}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                active
                  ? 'border-neon bg-neon/10 text-foreground'
                  : 'border-border bg-surface-2/60 text-muted-foreground hover:border-neon/40 hover:text-foreground',
              )}
            >
              <span className={cn(talero.className, 'text-lg tracking-wide')}>{f.shape}</span>
              {active && (
                <span className="grid size-5 place-items-center rounded-full bg-neon text-primary-foreground">
                  <Check className="size-3" weight="bold" />
                </span>
              )}
            </button>
          );
        })}
        <p className="text-micro mt-1 text-muted-foreground">
          Drag a player onto another to swap them — or tap two. Pick a shape above.
        </p>
      </div>
    </div>
  );
}
