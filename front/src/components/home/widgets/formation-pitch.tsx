'use client';

import { useState } from 'react';
import Image from 'next/image';

import { Plus, ArrowsLeftRight } from '@/components/common/icons';
import { cn } from '@/lib/utils';
import { formations, type FormationSlot } from '@/config/formation.config';

function PlayerDot({ slot }: { slot: FormationSlot }) {
  const open = slot.rating === undefined;

  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 transition-[left,top] duration-500 ease-out"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
      {open ? (
          <span className="grid size-12 place-items-center rounded-full border-2 border-dashed border-neon/60 bg-black/30 text-neon shadow-[0_0_24px_rgba(174,240,25,0.08)] md:size-13">
          <Plus className="size-4" />
        </span>
      ) : (
        <span className="relative">
          <span
            className={cn(
              'relative block size-13 overflow-hidden rounded-full border bg-gradient-to-b from-surface-3 to-surface-deep shadow-xl md:size-14',
              slot.highlight ? 'border-medal-gold ring-2 ring-medal-gold/70' : 'border-white/20',
            )}
          >
            {slot.portraitSrc ? (
              <Image
                src={slot.portraitSrc}
                alt={slot.name ?? slot.label}
                fill
                sizes="56px"
                className="scale-125 object-cover object-top"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : null}
          </span>
          <span className="absolute -right-1.5 -bottom-1 rounded-full border border-black/60 bg-surface-deep px-1.5 py-0.5 font-mono text-micro font-bold text-neon tabular-nums shadow">
            {slot.rating}
          </span>
        </span>
      )}
      <span
        className={cn(
          'max-w-[92px] truncate rounded-md border border-white/5 bg-black/55 px-2 py-0.5 text-eyebrow shadow-sm backdrop-blur-sm',
          open ? 'text-neon/80' : 'text-white/90',
        )}
      >
        {slot.label}
      </span>
    </div>
  );
}

/**
 * The user's XI on a stylised pitch, with a button to cycle the formation shape.
 * Height defaults to a fixed frame; pass `className` (e.g. `lg:h-full`) to let it
 * stretch and match a sibling column instead.
 */
export function FormationPitch({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const formation = formations[index];
  const cycle = () => setIndex((i) => (i + 1) % formations.length);

  return (
    <div
      className={cn(
        'pitch-stripes-v relative h-[500px] w-full overflow-hidden rounded-3xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_70px_rgba(0,0,0,0.22)] md:h-[540px]',
        className,
      )}
    >
      {/* Half-pitch markings stay low-contrast so the players read first. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(174,240,25,0.07),transparent_42%),linear-gradient(to_bottom,transparent_60%,rgba(0,0,0,0.16))]" />
      <div className="pointer-events-none absolute inset-3 rounded-2xl border border-white/14" />
      <div className="pointer-events-none absolute top-3 left-1/2 h-[27%] w-[58%] -translate-x-1/2 rounded-b-xl border-x border-b border-white/14" />
      <div className="pointer-events-none absolute top-3 left-1/2 h-[11%] w-[28%] -translate-x-1/2 rounded-b-md border-x border-b border-white/14" />
      <div className="pointer-events-none absolute -top-1 left-1/2 h-4 w-[19%] -translate-x-1/2 rounded-b border-x border-b border-white/20 bg-black/10" />
      <div className="pointer-events-none absolute top-[18%] left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-white/25" />
      <div className="pointer-events-none absolute top-[17.5%] left-1/2 size-24 -translate-x-1/2 rounded-full border border-white/14 [clip-path:inset(45%_0_0_0)]" />
      <div className="pointer-events-none absolute inset-x-3 bottom-3 h-px bg-white/14" />
      <div className="pointer-events-none absolute bottom-3 left-1/2 h-24 w-48 -translate-x-1/2 translate-y-1/2 rounded-[50%] border border-white/14" />
      <div className="pointer-events-none absolute top-3 left-3 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/14" />
      <div className="pointer-events-none absolute top-3 right-3 size-8 translate-x-1/2 -translate-y-1/2 rounded-full border border-white/14" />

      <span className="absolute top-5 left-5 z-10 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 font-mono text-micro font-bold tracking-[0.14em] text-white/75 backdrop-blur-md">
        {formation.shape} · {formation.filled}/{formation.total} LINED UP
      </span>

      <button
        type="button"
        onClick={cycle}
        className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs font-bold text-white/85 shadow-lg backdrop-blur-md transition hover:border-neon/50 hover:text-neon"
      >
        <ArrowsLeftRight className="size-3.5" />
        Change formation
      </button>

      {formation.slots.map((slot) => (
        <PlayerDot key={slot.label} slot={slot} />
      ))}
    </div>
  );
}
