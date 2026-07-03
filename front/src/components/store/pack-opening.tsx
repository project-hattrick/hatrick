'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { CaretRight, X } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { Button } from '@/components/ui/button';
import { HoloPlayerCard, type HoloPlayerCardProps, type CardStat } from '@/components/store/holo-player-card';
import { playRevealSound, playSwipeSound, playTearSound } from '@/components/store/pack-sounds';
import styles from './pack-opening.module.css';
import { cn } from '@/lib/utils';

const enum PackStage {
  Sealed = 'sealed',
  Opening = 'opening',
  FaceDown = 'face-down',
  Revealed = 'revealed',
  Summary = 'summary',
}

const TEAR_DURATION_MS = 950;
const CARD_EXIT_MS = 450;
/** Rise animation (0.7s) + a short beat before the next card flips on its own. */
const AUTO_REVEAL_MS = 850;
/** Flash lifetime — also locks advancing until the 0.65s flip transition finishes. */
const FLASH_MS = 700;
const SWIPE_THRESHOLD_PX = 90;
const CARD_WIDTH = 400;
const SUMMARY_CARD_WIDTH = 210;

const STAT_LABELS = ['DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS'] as const;
const statLine = (value: number): CardStat[] => STAT_LABELS.map((label) => ({ value, label }));

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

/** Foil card back shown before each reveal. */
function CardBack() {
  return (
    <div className={cn(styles.foil, 'flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl')}>
      <Image src="/cards/fade-logo.png" alt="" width={140} height={140} className="opacity-60" />
      <span className="text-2xl font-black tracking-widest text-white/90">TxODDS</span>
      <span className="text-[10px] tracking-[0.4em] text-white/50 uppercase">Player card</span>
    </div>
  );
}

/**
 * "Buy pack" CTA + stadium-podium opening flow:
 * sealed foil pack on the podium -> tear -> face-down card rises -> flip reveal
 * (flash + chime, advance by button / swipe / SPACE) -> pull summary.
 */
function PackOpening({ packName }: { packName: string }) {
  const [stage, setStage] = useState<PackStage | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [exitDir, setExitDir] = useState(0);
  const [flashing, setFlashing] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  const isLastCard = cardIndex === PACK_CARDS.length - 1;

  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    setStage(null);
    setCardIndex(0);
    setExitDir(0);
    setFlashing(false);
    setDragX(0);
    setDragging(false);
    dragStart.current = null;
  };

  const tearOpen = () => {
    playTearSound();
    setStage(PackStage.Opening);
    timer.current = setTimeout(() => setStage(PackStage.FaceDown), TEAR_DURATION_MS);
  };

  const reveal = () => {
    if (timer.current) clearTimeout(timer.current); // cancel a pending auto-reveal
    playRevealSound();
    setStage(PackStage.Revealed);
    setFlashing(true);
    timer.current = setTimeout(() => setFlashing(false), FLASH_MS);
  };

  const nextCard = (direction = 1) => {
    if (exitDir !== 0 || flashing) return; // locked while exiting or mid-flip
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
        setStage(PackStage.FaceDown);
        // Flip on its own after rising — only the first card asks for a manual reveal.
        timer.current = setTimeout(reveal, AUTO_REVEAL_MS);
      }
      setExitDir(0);
    }, CARD_EXIT_MS);
  };

  // Lock page scroll while the overlay is open.
  const open = stage !== null;
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // SPACE reveals / advances; ESC closes.
  useEffect(() => {
    if (stage === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key !== ' ') return;
      event.preventDefault();
      if (stage === PackStage.Sealed) tearOpen();
      else if (stage === PackStage.FaceDown) reveal();
      else if (stage === PackStage.Revealed) nextCard(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (stage !== PackStage.Revealed || exitDir !== 0) return;
    dragStart.current = event.clientX;
    setDragging(true);
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
    setDragging(false);
    if (Math.abs(distance) > SWIPE_THRESHOLD_PX) nextCard(Math.sign(distance));
    else setDragX(0);
  };

  const isDragging = dragging;
  const onCard = stage === PackStage.FaceDown || stage === PackStage.Revealed;
  const cardStyle: CSSProperties = {
    // capped by height too (card is 7/5 tall) so it fits between header and podium
    width: `min(${CARD_WIDTH}px, 82vw, 44svh)`,
    aspectRatio: '5 / 7',
    '--exit-dir': exitDir || 1,
    transform: isDragging || dragX !== 0 ? `translateX(${dragX}px) rotate(${dragX * 0.05}deg)` : undefined,
  } as CSSProperties;

  return (
    <>
      <Button className="w-full" onClick={() => setStage(PackStage.Sealed)}>
        Buy pack
        <CaretRight className="size-4" />
      </Button>

      {stage !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-20 bg-[#050506] bg-cover bg-center select-none animate-in fade-in duration-300 [&_img]:pointer-events-none [&_img]:[-webkit-user-drag:none]"
            style={{ backgroundImage: "url('/cards/stadium-podium.png')" }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="absolute top-20 right-5 z-10 rounded-full border border-border/60 bg-black/40 p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-5" />
            </button>

            {/* Header */}
            <div className="absolute inset-x-0 top-20 z-10 px-14 text-center">
              <span className="font-mono text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
                {packName}
                {onCard && ` · card ${cardIndex + 1}/${PACK_CARDS.length}`}
                {stage === PackStage.Summary && ' · summary'}
              </span>
            </div>

            {/* Pack info side panel */}
            {stage !== PackStage.Summary && (
              <GlassPanel
                tone="dark"
                className="absolute top-1/2 left-6 z-10 hidden w-[180px] -translate-y-1/2 flex-col overflow-hidden md:flex"
              >
                <div className="border-b border-border/60 px-4 py-3">
                  <div className="text-sm font-bold tracking-wide text-white uppercase">{packName}</div>
                  <div className="text-xs text-muted-foreground">{PACK_CARDS.length} cards</div>
                </div>
                <div className="p-3">
                  <div className={cn(styles.foil, 'flex w-full flex-col items-center justify-center gap-1.5 rounded-lg py-5')}>
                    <Image src="/cards/fade-logo.png" alt="" width={56} height={56} className="opacity-80" />
                    <span className="text-xs font-black tracking-widest text-white/90">TxODDS</span>
                    <span className="text-[8px] tracking-[0.3em] text-white/45 uppercase">{packName}</span>
                  </div>
                </div>
              </GlassPanel>
            )}

            {/* Podium stage */}
            {(stage === PackStage.Sealed || stage === PackStage.Opening) && (
              <div className={cn(styles.stage, styles.stagePack)}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Open pack"
                  onClick={tearOpen}
                  onKeyDown={(event) => event.key === 'Enter' && tearOpen()}
                  className={cn(styles.pack, styles.cardGlow, stage === PackStage.Opening && styles.opening)}
                >
                  <div className={styles.strip} />
                  <div className={styles.body} />
                  {stage === PackStage.Sealed && <div className={styles.shine} />}
                </div>
              </div>
            )}

            {onCard && (
              <div className={styles.stage}>
                {flashing && <div className={styles.flash} />}
                <div
                  key={cardIndex}
                  className={cn(
                    styles.flipScene,
                    styles.cardGlow,
                    styles.riseFromPodium,
                    isDragging && styles.dragging,
                    exitDir !== 0 && styles.cardExit,
                  )}
                  style={cardStyle}
                  onClick={stage === PackStage.FaceDown ? reveal : undefined}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerEnd}
                  onPointerCancel={onPointerEnd}
                >
                  <div className={cn(styles.flipInner, stage === PackStage.Revealed && styles.flipped)}>
                    <div className={styles.flipBack}>
                      <CardBack />
                    </div>
                    <div className={styles.flipFace}>
                      {/* Mounted only at reveal — nested preserve-3d ignores backface-visibility */}
                      {stage === PackStage.Revealed && <HoloPlayerCard {...PACK_CARDS[cardIndex]} width={CARD_WIDTH} />}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom controls */}
            {(stage !== PackStage.Summary && (
              <div className="absolute inset-x-0 bottom-[max(7svh,calc(env(safe-area-inset-bottom)+16px))] z-10 flex flex-col items-center gap-2 px-4 text-center">
                {stage === PackStage.FaceDown && (
                  <Button size="lg" className="px-10 text-base" onClick={reveal}>
                    Reveal card
                  </Button>
                )}
                {stage === PackStage.Revealed && (
                  <Button size="lg" className="px-10 text-base" onClick={() => nextCard(1)} disabled={exitDir !== 0 || flashing}>
                    {isLastCard ? 'See summary' : 'Next card'}
                  </Button>
                )}
                <span className="text-[11px] text-white/60">
                  {stage === PackStage.Sealed && 'Click the pack or press SPACE to tear it open'}
                  {stage === PackStage.FaceDown && 'Click or press SPACE to reveal'}
                  {stage === PackStage.Revealed && 'Swipe the card aside or press SPACE'}
                </span>
              </div>
            )) || null}

            {/* Summary */}
            {stage === PackStage.Summary && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                <div className="flex max-h-full w-full flex-col items-center gap-8 overflow-y-auto p-6 pt-24">
                  <div className="flex flex-col items-center gap-1.5">
                    <h2 className="text-4xl font-bold text-white md:text-5xl">You pulled {PACK_CARDS.length} cards</h2>
                    <span className="text-base text-muted-foreground">
                      Best pull: {bestCard.number} {bestCard.flag}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-6">
                    {PACK_CARDS.map((card, index) => (
                      <div key={index} className={styles.cardReveal} style={{ animationDelay: `${index * 0.12}s` }}>
                        <HoloPlayerCard {...card} width={SUMMARY_CARD_WIDTH} />
                      </div>
                    ))}
                  </div>
                  <Button size="lg" onClick={close}>
                    Add all to collection
                  </Button>
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

export { PackOpening };
