'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ParallaxPackProps {
  /** Sizing for the pack image (usually a height class). */
  className?: string;
  /** Resting pose — the pack leans "sideways" until the cursor steers it. */
  restTilt?: { rx: number; ry: number };
  /** How far the cursor can push the tilt, in degrees. */
  tiltRange?: number;
  /** Soft neon halo behind the pack (featured drop only). */
  glow?: boolean;
}

/** Default rest: leaning back and turned to the side, matching the home mode cards' pose. */
const REST_TILT = { rx: 6, ry: -16 };
const TILT_RANGE = 12;

/**
 * Foil pack with the same mouse-parallax treatment as the home mode-showcase card:
 * a perspective tilt that rests turned to the side and gently follows the cursor.
 */
export function ParallaxPack({ className, restTilt = REST_TILT, tiltRange = TILT_RANGE, glow = false }: ParallaxPackProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState(restTilt);

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: restTilt.rx - py * tiltRange, ry: restTilt.ry + px * tiltRange });
  }

  function handleLeave() {
    setTilt(restTilt);
  }

  return (
    <div className="[perspective:1200px]">
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
        className="relative transition-transform duration-200 ease-out will-change-transform [transform-style:preserve-3d] motion-reduce:transition-none"
      >
        {glow && <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 scale-90 rounded-full bg-neon/15 blur-3xl" />}
        <Image
          src="/cards/pack-foil.png"
          alt=""
          width={660}
          height={1122}
          className={cn('w-auto shrink-0 drop-shadow-[0_22px_44px_rgba(0,0,0,0.7)]', className)}
        />
      </div>
    </div>
  );
}
