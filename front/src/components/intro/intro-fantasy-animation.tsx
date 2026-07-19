'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import { HoloPlayerCard } from '@/components/store/holo-player-card';

/** The player whose real-match form drives the card buff. */
const PLAYER = {
  name: 'L. MARTÍNEZ',
  meta: 'ST · Argentina',
  flag: '🇦🇷',
  number: 22,
  holo: ['#75AADB', '#ffffff', '#75AADB'] as [string, string, string],
  portrait: '/cards/player-93.webp',
};

/** Live line from the feed (shown in the TxLINE lower-third). */
const FEED = [
  { label: 'Goals', value: '1' },
  { label: 'Shots', value: '3' },
  { label: 'Rating', value: '8.4' },
];

/** The six card attributes (2 columns of 3) — SHO/DRI lead so the rise reads clearly. */
const STATS = [
  { label: 'PAC', base: 82, boost: 3 },
  { label: 'SHO', base: 79, boost: 7 },
  { label: 'PAS', base: 84, boost: 2 },
  { label: 'DRI', base: 83, boost: 5 },
  { label: 'DEF', base: 42, boost: 1 },
  { label: 'PHY', base: 76, boost: 3 },
];

const TOTAL_BOOST = STATS.reduce((sum, s) => sum + s.boost, 0);

/**
 * Looping Fantasy intro sequence: a match plays behind, a TxLINE live lower-third names a player and
 * his stats, then the real app card (HoloPlayerCard) flies in and its attributes rise in motion —
 * showing "real form from TxLINE → your card gets buffed". Uses the actual front-end card component.
 */
export function IntroFantasyAnimation() {
  const [bgFailed, setBgFailed] = useState(false);
  const [hudIn, setHudIn] = useState(false);
  const [cardIn, setCardIn] = useState(false);
  const [buffed, setBuffed] = useState(false);
  const [progress, setProgress] = useState(0); // 0 = base stats, 1 = fully buffed

  useEffect(() => {
    let alive = true;
    let raf = 0;
    const timers: number[] = [];

    const animateProgress = (dur: number) => {
      const start = performance.now();
      const tick = (now: number) => {
        if (!alive) return;
        const t = Math.min(1, (now - start) / dur);
        setProgress(1 - Math.pow(1 - t, 3));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const loop = () => {
      if (!alive) return;
      setHudIn(false);
      setCardIn(false);
      setBuffed(false);
      setProgress(0);
      timers.push(window.setTimeout(() => alive && setHudIn(true), 350)); // feed names the player
      timers.push(window.setTimeout(() => alive && setCardIn(true), 1600)); // card flies in
      timers.push(
        window.setTimeout(() => {
          if (!alive) return;
          setBuffed(true); // form applied → stats rise
          animateProgress(950);
        }, 2600),
      );
      timers.push(window.setTimeout(loop, 6000)); // hold, then restart
    };
    loop();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const values = STATS.map((s) => ({ label: s.label, value: Math.round(s.base + s.boost * progress) }));

  return (
    <div className="relative h-full w-full overflow-hidden bg-surface-1">
      {/* Background match */}
      {bgFailed ? (
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,var(--color-pitch),transparent_60%),linear-gradient(180deg,var(--color-surface-2),var(--color-surface-1))]"
        >
          <div className="absolute inset-0 opacity-[0.06] [background:repeating-linear-gradient(90deg,transparent_0,transparent_38px,#fff_38px,#fff_39px)]" />
        </div>
      ) : (
        <video
          autoPlay
          muted
          loop
          playsInline
          onError={() => setBgFailed(true)}
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        >
          <source src="/onboarding/fantasy-bg.mp4" type="video/mp4" />
        </video>
      )}
      {/* Legibility overlay */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/40 to-surface-1/20" />

      {/* TxLINE live badge */}
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-neon/40 bg-black/45 px-3 py-1 backdrop-blur">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-neon opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-neon" />
        </span>
        <span className="text-micro font-bold uppercase tracking-widest text-neon">TxLINE · Live feed</span>
      </div>

      {/* Player lower-third (from the feed) */}
      <div
        className={cn(
          'absolute bottom-4 left-4 max-w-[58%] rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur-md transition-all duration-500 ease-soft',
          hudIn ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
        )}
      >
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-lg font-bold tracking-tight text-white">{PLAYER.name}</span>
          <span className="text-caption text-white/60">{PLAYER.meta}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          {FEED.map((f) => (
            <div key={f.label} className="flex items-center gap-1.5">
              <span className="font-heading text-base font-bold tabular-nums text-neon">{f.value}</span>
              <span className="text-micro uppercase tracking-wide text-white/50">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form-boost chip (appears with the buff) */}
      <div
        className={cn(
          'absolute right-[7%] top-6 z-10 flex items-center gap-1.5 rounded-full border border-neon/50 bg-neon/15 px-3 py-1 transition-all duration-500',
          buffed ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
        )}
      >
        <span className="text-sm leading-none text-neon">▲</span>
        <span className="text-caption font-bold text-neon">Form +{TOTAL_BOOST}</span>
      </div>

      {/* The real card flying in, stats rising */}
      <div
        className={cn(
          'absolute right-[6%] top-1/2 -translate-y-1/2 transition-all duration-700 ease-soft',
          cardIn ? 'translate-x-0 rotate-0 opacity-100' : 'translate-x-16 rotate-3 opacity-0',
        )}
        style={{ filter: buffed ? 'drop-shadow(0 0 26px color-mix(in oklch, var(--color-neon) 45%, transparent))' : undefined }}
      >
        <HoloPlayerCard
          width={210}
          number={PLAYER.number}
          flag={PLAYER.flag}
          portraitSrc={PLAYER.portrait}
          holoColors={PLAYER.holo}
          stats={values}
        />
      </div>
    </div>
  );
}
