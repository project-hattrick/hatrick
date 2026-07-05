'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { buttonVariants } from '@/components/ui/button';
import type { PlayMode } from '@/config/home.config';
import { useHomeEntryStore } from '@/store/home-entry.store';

/** Resting pose: leaning back into the stadium; the cursor gently steers it upright. */
const REST_TILT = { rx: 9, ry: 0 };
const REST_SHIFT = { x: 0, y: 0 };
const TILT_RANGE = 7;
const PARALLAX_RANGE = 14;

/** Immersive mode card — the hero prediction-dock bezel frame + a mouse parallax tilt. */
function ModeShowcaseCard({ mode }: { mode: PlayMode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState(REST_TILT);
  const [shift, setShift] = useState(REST_SHIFT);
  const openMode = useHomeEntryStore((state) => state.openMode);
  const Icon = mode.icon;

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: REST_TILT.rx - py * TILT_RANGE, ry: px * TILT_RANGE });
    setShift({ x: px * -PARALLAX_RANGE, y: py * -PARALLAX_RANGE });
  }

  function handleLeave() {
    setTilt(REST_TILT);
    setShift(REST_SHIFT);
  }

  return (
    <div className="[perspective:1200px]">
      {/* Padded "bezel" frame — same treatment as the hero prediction dock. */}
      <div
        ref={frameRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
        className="group rounded-[26px] bg-muted p-1.5 shadow-[0px_0px_0px_1px_rgba(255,255,255,0.05),0px_2px_6px_rgba(0,0,0,0.4),0px_16px_40px_-12px_rgba(0,0,0,0.55)] transition-transform duration-200 ease-out will-change-transform motion-reduce:transition-none"
      >
        <div className="relative flex min-h-[26rem] flex-col overflow-hidden rounded-[20px] bg-surface-1 p-5 ring-1 ring-white/10 md:min-h-[30rem]">
          <div aria-hidden className="absolute inset-0">
            <Image
              src={mode.art}
              alt=""
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              style={{ transform: `translate3d(${shift.x}px, ${shift.y}px, 0) scale(1.08)` }}
              className="object-cover opacity-45 transition-transform duration-200 ease-out motion-reduce:transition-none"
            />
            {mode.emblem ? (
              <Image
                src={mode.emblem}
                alt=""
                width={224}
                height={224}
                style={{ transform: `translateX(-50%) translate3d(${shift.x * 1.6}px, ${shift.y * 1.6}px, 0)` }}
                className="absolute top-16 left-1/2 w-56 opacity-60 transition-transform duration-200 ease-out motion-reduce:transition-none"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-overlay/95 via-overlay/45 to-overlay/10" />
          </div>

          <div className="relative flex items-center justify-between">
            {mode.badge ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-eyebrow text-neon">
                <span className="size-1.5 animate-pulse rounded-full bg-neon" />
                {mode.badge}
              </span>
            ) : (
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-overlay/60 text-muted-foreground">
                <Icon className="size-4" />
              </span>
            )}
          </div>

          <div className="relative mt-auto flex flex-col gap-4 pt-6">
            <div className="flex flex-col gap-1">
              <h3 className="font-talero text-4xl uppercase md:text-5xl">{mode.title}</h3>
              <p className="text-caption text-muted-foreground">{mode.description}</p>
            </div>

            <ul className="grid grid-cols-4 divide-x divide-border/60 border-y border-border/60 py-3">
              {mode.features.map((feature) => {
                const FeatureIcon = feature.icon;
                return (
                  <li key={feature.label} className="flex flex-col items-center gap-1.5 px-1 text-center">
                    <FeatureIcon className="size-4 text-muted-foreground" />
                    <span className="text-micro text-muted-foreground">{feature.label}</span>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={() => openMode(mode.key)}
              className={buttonVariants({
                size: 'lg',
                className: 'h-12 w-full rounded-xl font-bold tracking-widest uppercase',
              })}
            >
              {mode.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ModeShowcaseCard };
