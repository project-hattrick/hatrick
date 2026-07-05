'use client';

import { useEffect, useRef, useState, type ComponentProps, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { CaretRight, X } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { Button } from '@/components/ui/button';
import { HoloPlayerCard } from '@/components/store/holo-player-card';
import { playRevealSound, playSwipeSound, playTearSound } from '@/components/store/pack-sounds';
import { drawPack, type PackCard } from '@/config/pack-pool.config';
import styles from './pack-opening.module.css';
import { cn } from '@/lib/utils';

const enum PackStage {
  Sealed = 'sealed',
  Opening = 'opening',
  FaceDown = 'face-down',
  Revealed = 'revealed',
  Summary = 'summary',
}

const enum PullRarity {
  Standard = 'standard',
  Epic = 'epic',
  Legendary = 'legendary',
}

const TEAR_DURATION_MS = 950;
const CARD_EXIT_MS = 450;
/** Rise animation (0.7s) + a short beat before the next card flips on its own. */
const AUTO_REVEAL_MS = 850;
/** Flash lifetime — also locks advancing until the 0.65s flip transition finishes. */
const FLASH_MS = 700;
const SWIPE_THRESHOLD_PX = 90;
const CARD_WIDTH = 400;
const GROUP_CARD_WIDTH = 300;
const SUMMARY_CARD_WIDTH = 148;
const XI_PACK_SIZE = 11;
const XI_GROUP_SIZE = 3;

const raritySurfaceColors: Partial<Record<PullRarity, [string, string]>> = {
  [PullRarity.Epic]: ['#2b1742', '#69419a'],
  [PullRarity.Legendary]: ['#6b4608', '#e0b83f'],
};

/** Default cards per pack — each opening draws them at random from the FULL character pool (pack-pool.config). */
const DEFAULT_PACK_SIZE = 5;

function orderPackCards(cards: PackCard[]): PackCard[] {
  if (cards.length !== XI_PACK_SIZE) return cards;
  const ranked = [...cards].sort((left, right) => (right.number ?? 0) - (left.number ?? 0));
  const featured = ranked.slice(0, 2).reverse();
  const featuredSet = new Set(featured);
  return [...cards.filter((card) => !featuredSet.has(card)), ...featured];
}

function pullRarity(index: number, total: number): PullRarity {
  if (total !== XI_PACK_SIZE) return PullRarity.Standard;
  if (index === total - 1) return PullRarity.Legendary;
  if (index === total - 2) return PullRarity.Epic;
  return PullRarity.Standard;
}

function revealGroupSize(index: number, total: number): number {
  if (total !== XI_PACK_SIZE || index >= 9) return 1;
  return XI_GROUP_SIZE;
}

interface PackOpeningProps {
  packName: string;
  /** Cards drawn per opening. */
  packSize?: number;
  /** Trigger button content — defaults to "Buy pack" + caret. */
  cta?: ReactNode;
  ctaClassName?: string;
  ctaSize?: ComponentProps<typeof Button>['size'];
  ctaVariant?: ComponentProps<typeof Button>['variant'];
  /** Controlled open — when set, the overlay launches/closes from the parent instead of the CTA. */
  open?: boolean;
  /** Fired when the overlay closes (X / ESC / summary) so a controlling parent can sync its state. */
  onClose?: () => void;
  /** Hide the built-in "Buy pack" trigger (for controlled/embedded use). */
  hideTrigger?: boolean;
  /** Fired with the pulled hand when the player confirms the summary — the seam to persist cards. */
  onComplete?: (cards: PackCard[]) => void;
}

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
function PackOpening({
  packName,
  packSize = DEFAULT_PACK_SIZE,
  cta,
  ctaClassName,
  ctaSize,
  ctaVariant,
  open: controlledOpen,
  onClose,
  hideTrigger = false,
  onComplete,
}: PackOpeningProps) {
  const controlled = controlledOpen !== undefined;
  const [stage, setStage] = useState<PackStage | null>(null);
  const [packCards, setPackCards] = useState<PackCard[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [exitDir, setExitDir] = useState(0);
  const [flashing, setFlashing] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  const groupSize = revealGroupSize(cardIndex, packCards.length);
  const currentCards = packCards.slice(cardIndex, cardIndex + groupSize);
  const isLastGroup = cardIndex + currentCards.length >= packCards.length;
  const bestCard = packCards.length
    ? packCards.reduce((best, card) => ((card.number ?? 0) > (best.number ?? 0) ? card : best))
    : null;

  /** Buy: draw a fresh random hand from the full character pool, then present the sealed pack. */
  const buyPack = () => {
    setPackCards(orderPackCards(drawPack(packSize)));
    setStage(PackStage.Sealed);
  };

  /** Reset only React state — no ref access, so it's safe to call during render (controlled sync). */
  const resetState = () => {
    setStage(null);
    setCardIndex(0);
    setExitDir(0);
    setFlashing(false);
    setDragX(0);
    setDragging(false);
  };

  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    dragStart.current = null;
    resetState();
    onClose?.();
  };

  /** Summary confirm — hand the pulled cards to the parent (collection persistence) before closing. */
  const finish = () => {
    onComplete?.(packCards);
    close();
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
      if (isLastGroup) {
        playRevealSound();
        setStage(PackStage.Summary);
        setCardIndex(0);
      } else {
        setCardIndex((index) => index + revealGroupSize(index, packCards.length));
        setStage(PackStage.FaceDown);
        // Flip on its own after rising — only the first card asks for a manual reveal.
        timer.current = setTimeout(reveal, AUTO_REVEAL_MS);
      }
      setExitDir(0);
    }, CARD_EXIT_MS);
  };

  // Controlled mode: launch on the parent opening, tear down when it closes.
  // Adjusted during render (like matchmaking-dialog) — state only, never the timer ref.
  const [wasOpen, setWasOpen] = useState(false);
  if (controlled && controlledOpen && !wasOpen) {
    setWasOpen(true);
    if (stage === null) buyPack();
  } else if (controlled && !controlledOpen && wasOpen) {
    setWasOpen(false);
    if (stage !== null) resetState();
  }

  // Clear any pending animation timer once the overlay is closed (ref access lives in an effect).
  const overlayOpen = stage !== null;
  useEffect(() => {
    if (overlayOpen) return;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, [overlayOpen]);

  // Lock page scroll while the overlay is open.
  useEffect(() => {
    if (!overlayOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [overlayOpen]);

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
  const groupStyle: CSSProperties = {
    '--exit-dir': exitDir || 1,
    transform: isDragging || dragX !== 0 ? `translateX(${dragX}px) rotate(${dragX * 0.025}deg)` : undefined,
  } as CSSProperties;

  return (
    <>
      {!hideTrigger && (
        <Button variant={ctaVariant} size={ctaSize} className={ctaClassName} onClick={buyPack}>
          {cta ?? (
            <>
              Buy pack
              <CaretRight className="size-4" />
            </>
          )}
        </Button>
      )}

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
                {onCard &&
                  ` · ${currentCards.length > 1 ? `cards ${cardIndex + 1}–${cardIndex + currentCards.length}` : `card ${cardIndex + 1}`}/${packCards.length}`}
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
                  <div className="text-xs text-muted-foreground">{packCards.length} cards</div>
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
              <div className={cn(styles.stage, styles.cardStage)}>
                {flashing && <div className={styles.flash} />}
                <div
                  key={cardIndex}
                  className={cn(
                    styles.revealGroup,
                    styles.riseFromPodium,
                    isDragging && styles.dragging,
                    exitDir !== 0 && styles.cardExit,
                  )}
                  style={currentCards.length === 1 ? cardStyle : groupStyle}
                  onClick={stage === PackStage.FaceDown ? reveal : undefined}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerEnd}
                  onPointerCancel={onPointerEnd}
                >
                  {currentCards.map((card, groupIndex) => {
                    const index = cardIndex + groupIndex;
                    const rarity = pullRarity(index, packCards.length);
                    const width = currentCards.length === 1 ? CARD_WIDTH : GROUP_CARD_WIDTH;
                    return (
                      <div
                        key={card.name}
                        className={cn(
                          styles.flipScene,
                          styles.cardGlow,
                          currentCards.length === 1 ? styles.soloCard : styles.batchCard,
                          styles[rarity],
                        )}
                        style={{ '--group-delay': `${groupIndex * 90}ms` } as CSSProperties}
                      >
                        <div className={cn(styles.flipInner, stage === PackStage.Revealed && styles.flipped)}>
                          <div className={styles.flipBack}>
                            <CardBack />
                          </div>
                          <div className={styles.flipFace}>
                            {stage === PackStage.Revealed && (
                              <HoloPlayerCard
                                {...card}
                                surfaceColors={raritySurfaceColors[rarity]}
                                surfaceShine={rarity === PullRarity.Legendary}
                                width={width}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom controls */}
            {(stage !== PackStage.Summary && (
              <div className="absolute inset-x-0 bottom-[max(7svh,calc(env(safe-area-inset-bottom)+16px))] z-10 flex flex-col items-center gap-2 px-4 text-center">
                {stage === PackStage.Revealed && currentCards.length === 1 && (
                  <span className={cn('text-lg font-bold text-white drop-shadow', styles[pullRarity(cardIndex, packCards.length)])}>
                    {currentCards[0].name} <span className="text-white/70">{currentCards[0].flag}</span>
                  </span>
                )}
                {stage === PackStage.Revealed && currentCards.length > 1 && (
                  <span className="text-sm font-semibold tracking-wide text-white/80 uppercase">Three new players</span>
                )}
                {stage === PackStage.FaceDown && (
                  <Button size="lg" className="px-10 text-base" onClick={reveal}>
                    Reveal card
                  </Button>
                )}
                {stage === PackStage.Revealed && (
                  <Button size="lg" className="px-10 text-base" onClick={() => nextCard(1)} disabled={exitDir !== 0 || flashing}>
                    {isLastGroup ? 'See summary' : currentCards.length > 1 ? 'Next reveal' : 'Next card'}
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
                <div className={styles.summaryLayout}>
                  <div className="flex flex-col items-center gap-1.5">
                    <h2 className="text-3xl font-bold text-white md:text-4xl">You pulled {packCards.length} cards</h2>
                    {bestCard && (
                      <span className="text-base text-muted-foreground">
                        Best pull: {bestCard.name} {bestCard.flag} · {bestCard.number}
                      </span>
                    )}
                  </div>
                  <div className={styles.summaryGrid}>
                    {packCards.map((card, index) => {
                      const rarity = pullRarity(index, packCards.length);
                      return (
                        <div
                          key={card.name}
                          className={cn(styles.cardReveal, styles.summaryCard, styles[rarity])}
                          style={{ animationDelay: `${index * 0.06}s` }}
                        >
                          <div className={styles.summaryCardFrame}>
                            <HoloPlayerCard
                              {...card}
                              surfaceColors={raritySurfaceColors[rarity]}
                              surfaceShine={rarity === PullRarity.Legendary}
                              width={SUMMARY_CARD_WIDTH}
                            />
                          </div>
                          <span className="max-w-full truncate text-xs font-semibold text-white/90">{card.name}</span>
                          {rarity !== PullRarity.Standard && <span className={styles.rarityLabel}>{rarity}</span>}
                        </div>
                      );
                    })}
                  </div>
                  <Button size="lg" onClick={finish}>
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
