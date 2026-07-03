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
        <span className="grid size-11 place-items-center rounded-full border-2 border-dashed border-neon/60 bg-black/25 text-neon">
          <Plus className="size-4" />
        </span>
      ) : (
        <span className="relative">
          <span
            className={cn(
              'relative block size-12 overflow-hidden rounded-full border bg-gradient-to-b from-[#2c3757] to-[#141a2c] shadow-lg',
              slot.highlight ? 'border-[#d8c46a] ring-2 ring-[#d8c46a]/70' : 'border-white/20',
            )}
          >
            {slot.portraitSrc ? (
              <Image
                src={slot.portraitSrc}
                alt={slot.name ?? slot.label}
                fill
                sizes="48px"
                className="scale-125 object-cover object-top"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : null}
          </span>
          <span className="absolute -right-1.5 -bottom-1 rounded-full border border-black/60 bg-[#0f130f] px-1.5 py-0.5 font-mono text-[10px] font-bold text-neon tabular-nums shadow">
            {slot.rating}
          </span>
        </span>
      )}
      <span
        className={cn(
          'max-w-[80px] truncate rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase backdrop-blur-sm',
          open ? 'text-neon/80' : 'text-white/90',
        )}
      >
        {slot.label}
      </span>
    </div>
  );
}

/** The user's XI on a stylised pitch, with a button to cycle the formation shape. */
export function FormationPitch() {
  const [index, setIndex] = useState(0);
  const formation = formations[index];
  const cycle = () => setIndex((i) => (i + 1) % formations.length);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[repeating-linear-gradient(180deg,#0d2417_0_46px,#0f2a1b_46px_92px)] md:h-[480px]">
      {/* Pitch markings — kept low-contrast so the players read first. */}
      <div className="pointer-events-none absolute inset-3 rounded-lg border border-white/10" />
      <div className="pointer-events-none absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-white/10" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute top-3 left-1/2 h-12 w-2/5 -translate-x-1/2 rounded-b-md border-x border-b border-white/10" />
      <div className="pointer-events-none absolute bottom-3 left-1/2 h-16 w-1/2 -translate-x-1/2 rounded-t-md border-x border-t border-white/10" />

      <span className="absolute top-4 left-4 z-10 font-mono text-[10px] font-bold tracking-[0.14em] text-white/70">
        {formation.shape} · {formation.filled}/{formation.total} ESCALADOS
      </span>

      <button
        type="button"
        onClick={cycle}
        className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-bold text-white/85 backdrop-blur-md transition hover:border-neon/50 hover:text-neon"
      >
        <ArrowsLeftRight className="size-3.5" />
        Trocar formação
      </button>

      {formation.slots.map((slot) => (
        <PlayerDot key={slot.label} slot={slot} />
      ))}
    </div>
  );
}
