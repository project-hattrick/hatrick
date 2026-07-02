'use client';

import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X } from '@/components/common/icons';
import { Button } from '@/components/ui/button';
import { HoloPlayerCard, type HoloPlayerCardProps, type CardStat } from '@/components/store/holo-player-card';
import { playRevealSound, playSwipeSound, playTearSound } from '@/components/store/pack-sounds';
import styles from './pack-opening.module.css';
import { cn } from '@/lib/utils';

const enum PackStage {
  Sealed = 'sealed',
  Opening = 'opening',
  Revealed = 'revealed',
  Summary = 'summary',
}

const TEAR_DURATION_MS = 950;
const CARD_EXIT_MS = 450;
const SWIPE_THRESHOLD_PX = 90;
const CARD_WIDTH = 400;
const SUMMARY_CARD_WIDTH = 150;

const statLine = (value: number): CardStat[] => Array.from({ length: 6 }, () => ({ value, label: 'DIV' }));

/** Placeholder pull until packs come from the API — varied identity and portraits.
 *  holoColors = country flag colors, driving each card's hover refraction. */
const PACK_CARDS: HoloPlayerCardProps[] = [
  { number: 93, flag: '🇱🇺', stats: statLine(91), holoColors: ['#ef2b3d', '#f5f5f5', '#00a2e1'], portraitSrc: '/cards/player-93.png' },
  { number: 10, flag: '🇧🇷', stats: statLine(88), holoColors: ['#009739', '#fedd00', '#012169'], portraitSrc: '/cards/player-green.png' },
  { number: 1, flag: '🇯🇵', stats: statLine(84), holoColors: ['#bc002d', '#ffffff', '#bc002d'], portraitSrc: '/cards/player-keeper.png' },
  { number: 21, flag: '🇫🇷', stats: statLine(79), holoColors: ['#0055a4', '#ffffff', '#ef4135'], portraitSrc: '/cards/player-green.png' },
  { number: 4, flag: '🇬🇭', stats: statLine(75), holoColors: ['#ce1126', '#fcd116', '#006b3f'], portraitSrc: '/cards/player-93.png' },
];

const bestCard = PACK_CARDS.reduce((best, card) => ((card.number ?? 0) > (best.number ?? 0) ? card : best));

/**
 * "Buy pack" CTA + fullscreen pack-opening flow:
 * sealed foil pack -> tear (sound) -> card stack browsed by swipe or button -> pull summary.
 */
function PackOpening({ packName }: { packName: string }) {
  const [stage, setStage] = useState<PackStage | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [exitDir, setExitDir] = useState(0);
  const [dragX, setDragX] = useState(0);
  const dragStart = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  const isLastCard = cardIndex === PACK_CARDS.length - 1;

  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    setStage(null);
    setCardIndex(0);
    setExitDir(0);
    setDragX(0);
    dragStart.current = null;
  };

  const tearOpen = () => {
    playTearSound();
    setStage(PackStage.Opening);
    timer.current = setTimeout(() => {
      playRevealSound();
      setStage(PackStage.Revealed);
    }, TEAR_DURATION_MS);
  };

  const nextCard = (direction = 1) => {
    if (exitDir !== 0) return;
    playSwipeSound();
    setExitDir(direction);
    setDragX(0);
    timer.current = setTimeout(() => {
      if (isLastCard) {
        playRevealSound();
        setStage(PackStage.Summary);
        setCardIndex(0);
      } else {
        setCardIndex((index) => index + 1);
      }
      setExitDir(0);
    }, CARD_EXIT_MS);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (exitDir !== 0) return;
    dragStart.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    setDragX(event.clientX - dragStart.current);
  };

  const onPointerEnd = () => {
    if (dragStart.current === null) return;
    const distance = dragX;
    dragStart.current = null;
    if (Math.abs(distance) > SWIPE_THRESHOLD_PX) nextCard(Math.sign(distance));
    else setDragX(0);
  };

  const isDragging = dragStart.current !== null;
  const topCardStyle: CSSProperties = {
    zIndex: 20,
    '--exit-dir': exitDir || 1,
    transform: isDragging || dragX !== 0 ? `translateX(${dragX}px) rotate(${dragX * 0.05}deg)` : undefined,
  } as CSSProperties;

  return (
    <>
      <Button className="w-full" onClick={() => setStage(PackStage.Sealed)}>
        Buy pack
      </Button>

      {stage !== null &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0c] animate-in fade-in duration-300">
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="absolute top-5 right-5 rounded-full border border-border/60 p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-5" />
            </button>

            {(stage === PackStage.Sealed || stage === PackStage.Opening) && (
              <div className="flex flex-col items-center gap-6">
                <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">{packName}</span>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Open pack"
                  onClick={tearOpen}
                  onKeyDown={(event) => event.key === 'Enter' && tearOpen()}
                  className={cn(styles.pack, stage === PackStage.Opening && styles.opening)}
                >
                  <div className={styles.strip} />
                  <div className={styles.body}>
                    <Image src="/cards/fade-logo.png" alt="" width={120} height={120} className="opacity-60" />
                    <span className="text-xl font-black tracking-widest text-white/90">TxODDS</span>
                    <span className="text-[10px] tracking-[0.4em] text-white/50 uppercase">Player pack</span>
                  </div>
                  {stage === PackStage.Sealed && <div className={styles.shine} />}
                </div>
                <span className="text-xs text-muted-foreground">
                  {stage === PackStage.Sealed ? 'Click the pack to tear it open' : ' '}
                </span>
              </div>
            )}

            {stage === PackStage.Revealed && (
              <div className="flex flex-col items-center gap-6">
                <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
                  {packName} · card {cardIndex + 1}/{PACK_CARDS.length}
                </span>

                <div className={cn(styles.stack, styles.cardReveal)}>
                  {PACK_CARDS.map((card, index) => {
                    if (index < cardIndex) return null;
                    const depth = index - cardIndex;
                    if (depth === 0) {
                      return (
                        <div
                          key={index}
                          className={cn(styles.stackCard, styles.stackTop, isDragging && styles.dragging, exitDir !== 0 && styles.cardExit)}
                          style={topCardStyle}
                          onPointerDown={onPointerDown}
                          onPointerMove={onPointerMove}
                          onPointerUp={onPointerEnd}
                          onPointerCancel={onPointerEnd}
                        >
                          <HoloPlayerCard {...card} width={CARD_WIDTH} />
                        </div>
                      );
                    }
                    return (
                      <div
                        key={index}
                        className={cn(styles.stackCard, styles.stackBehind)}
                        style={{
                          transform: `translate(${depth * 10}px, ${depth * 6}px) rotate(${depth * 1.6}deg) scale(${1 - depth * 0.02})`,
                          zIndex: 20 - depth,
                        }}
                      >
                        <HoloPlayerCard {...card} width={CARD_WIDTH} />
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Button variant="outline" onClick={() => nextCard(1)} disabled={exitDir !== 0}>
                    {isLastCard ? 'See summary' : 'Next card'}
                  </Button>
                  <span className="text-[11px] text-muted-foreground">or drag the card aside</span>
                </div>
              </div>
            )}

            {stage === PackStage.Summary && (
              <div className="flex max-h-full flex-col items-center gap-6 overflow-y-auto p-6">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">{packName} · summary</span>
                  <h2 className="text-2xl font-bold text-white">You pulled {PACK_CARDS.length} cards</h2>
                  <span className="text-sm text-muted-foreground">
                    Best pull: {bestCard.number} {bestCard.flag}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  {PACK_CARDS.map((card, index) => (
                    <div key={index} className={styles.cardReveal} style={{ animationDelay: `${index * 0.12}s` }}>
                      <HoloPlayerCard {...card} width={SUMMARY_CARD_WIDTH} />
                    </div>
                  ))}
                </div>

                <Button onClick={close}>Add all to collection</Button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

export { PackOpening };
