'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, CircleNotch } from '@/components/common/icons';
import { useT } from '@/i18n/i18n-provider';
import { cn } from '@/lib/utils';
import { IntroStep, INTRO_ORDER } from '@/enums/intro-step.enum';
import { useIntroStore } from '@/store/intro.store';
import type { DotPath } from '@/i18n/translate';
import type { Dictionary } from '@/i18n/get-dictionary';
import { INTRO_STEPS, type IntroStepContent } from './intro-content';
import { IntroFantasyAnimation } from './intro-fantasy-animation';

type Key = DotPath<Dictionary>;

/** Typed i18n keys per step so `useT()` stays type-checked (all 4 locales must define them). */
const COPY: Record<IntroStep, { headline: Key; body: Key }> = {
  [IntroStep.Live]: { headline: 'intro.steps.live.headline', body: 'intro.steps.live.body' },
  [IntroStep.Fantasy]: { headline: 'intro.steps.fantasy.headline', body: 'intro.steps.fantasy.body' },
  [IntroStep.Cards]: { headline: 'intro.steps.cards.headline', body: 'intro.steps.cards.body' },
};

/** Responsive segmented progress — each bar fills; the active one fills over the hold delay. */
function Progress({ index, fill }: { index: number; fill: number }) {
  return (
    <div className="flex flex-1 items-center gap-2">
      {INTRO_ORDER.map((_, i) => (
        <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-neon"
            style={{ width: `${(i < index ? 1 : i === index ? fill : 0) * 100}%`, transition: 'width 90ms linear' }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Media for the active step: the autoplayed clip, or a branded panel while the clip is missing
 * (so the tour looks intentional before the videos are recorded). Keyed by step in the parent.
 */
function VideoStage({ content, fallback }: { content: IntroStepContent; fallback?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const Icon = content.icon;

  if (failed) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="relative grid h-full w-full place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_35%,color-mix(in_oklch,var(--color-neon)_14%,transparent),transparent_65%),linear-gradient(180deg,var(--color-surface-2),var(--color-surface-1))]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05] [background:repeating-linear-gradient(90deg,transparent_0,transparent_38px,#fff_38px,#fff_39px)]"
        />
        <div className="grid size-16 place-items-center rounded-3xl border border-neon/25 bg-neon/10">
          <Icon className="size-8 text-neon" weight="duotone" />
        </div>
      </div>
    );
  }

  return (
    <>
      <video
        key={content.videoSrc}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={content.poster}
        onError={() => setFailed(true)}
        onLoadedData={() => setReady(true)}
        onCanPlay={() => setReady(true)}
        className="h-full w-full object-cover"
      >
        <source src={content.videoSrc} type="video/mp4" />
      </video>
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-surface-2">
          <CircleNotch className="size-8 animate-spin text-neon" />
        </div>
      )}
    </>
  );
}

/**
 * Judge-facing intro tour, opened by `?onboarding=true`. Non-dismissable (no X / overlay / ESC) —
 * you step through it and finish with "Enter Hatrick". Video on top, a tight content block below.
 */
export function IntroDialog() {
  const t = useT();
  const open = useIntroStore((s) => s.open);
  const step = useIntroStore((s) => s.step);
  const next = useIntroStore((s) => s.next);
  const back = useIntroStore((s) => s.back);
  const close = useIntroStore((s) => s.close);

  const index = INTRO_ORDER.indexOf(step);
  const isFirst = index === 0;
  const isLast = index === INTRO_ORDER.length - 1;
  const content = INTRO_STEPS[index];
  const copy = COPY[step];
  const Icon = content.icon;

  // Hold gate: the active step's progress bar fills over HOLD_MS before "Next" unlocks — so the
  // user actually watches each step. Steps already seen unlock instantly on revisit (Back → Next).
  const HOLD_MS = 2000;
  const [completed, setCompleted] = useState<Set<number>>(() => new Set());
  const [fill, setFill] = useState(0);

  useEffect(() => {
    if (!open) return;
    if (completed.has(index)) {
      setFill(1);
      return;
    }
    setFill(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / HOLD_MS);
      setFill(t);
      if (t >= 1) {
        setCompleted((prev) => new Set(prev).add(index));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, completed, open]);

  const canAdvance = completed.has(index) || fill >= 1;

  // Warm the next step's clip during the current step's hold, so advancing is instant.
  const nextSrc = index < INTRO_ORDER.length - 1 ? INTRO_STEPS[index + 1]?.videoSrc : undefined;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-[94vw] max-w-[min(94vw,680px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(94vw,680px)] sm:p-0"
      >
        {/* Media on top */}
        <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-surface-2">
          <VideoStage
            key={step}
            content={content}
            fallback={step === IntroStep.Cards ? <IntroFantasyAnimation /> : undefined}
          />
        </div>

        {/* Content below — direct: progress, headline, one line of body, nav */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5 sm:gap-5 sm:p-7">
          <div className="flex items-center gap-3">
            <Progress index={index} fill={fill} />
            <span className="shrink-0 text-micro font-bold tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, '0')} / {String(INTRO_ORDER.length).padStart(2, '0')}
            </span>
          </div>

          <div
            key={step}
            className="flex flex-col gap-2.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
          >
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 shrink-0 place-items-center rounded-xl border border-neon/25 bg-neon/10 sm:size-9">
                <Icon className="size-4 text-neon sm:size-5" weight="duotone" />
              </div>
              <DialogTitle className="font-heading text-lg font-bold leading-tight tracking-tight sm:text-2xl">
                {t(copy.headline)}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t(copy.body)}
            </DialogDescription>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-1">
            <Button
              variant="ghost"
              shape="pill"
              onClick={back}
              className={cn('text-muted-foreground', isFirst && 'pointer-events-none opacity-0')}
              aria-hidden={isFirst}
              data-icon="inline-start"
            >
              <ArrowLeft />
              {t('intro.back')}
            </Button>
            <Button
              shape="pill"
              size="lg"
              onClick={isLast ? close : next}
              disabled={!canAdvance}
              data-icon="inline-end"
              className="min-w-[9.5rem] font-semibold"
            >
              {isLast ? t('intro.cta') : t('intro.next')}
              <ArrowRight />
            </Button>
          </div>
        </div>

        {nextSrc && (
          <video
            key={nextSrc}
            muted
            preload="auto"
            playsInline
            aria-hidden
            className="pointer-events-none absolute h-px w-px opacity-0"
          >
            <source src={nextSrc} type="video/mp4" />
          </video>
        )}
      </DialogContent>
    </Dialog>
  );
}
