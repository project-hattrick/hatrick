'use client';

import { useState, type ReactNode } from 'react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from '@/components/common/icons';
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
  [IntroStep.Welcome]: { headline: 'intro.steps.welcome.headline', body: 'intro.steps.welcome.body' },
  [IntroStep.Live]: { headline: 'intro.steps.live.headline', body: 'intro.steps.live.body' },
  [IntroStep.Fantasy]: { headline: 'intro.steps.fantasy.headline', body: 'intro.steps.fantasy.body' },
};

/** Segmented progress bar — filled up to the active step. */
function Progress({ index }: { index: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {INTRO_ORDER.map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-1 rounded-full transition-all duration-500 ease-soft',
            i <= index ? 'bg-neon' : 'bg-surface-3',
            i === index ? 'w-8' : 'w-5',
          )}
        />
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
    <video
      key={content.videoSrc}
      autoPlay
      muted
      loop
      playsInline
      poster={content.poster}
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    >
      <source src={content.videoSrc} type="video/mp4" />
    </video>
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
            fallback={step === IntroStep.Fantasy ? <IntroFantasyAnimation /> : undefined}
          />
        </div>

        {/* Content below — direct: progress, headline, one line of body, nav */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <Progress index={index} />
            <span className="text-micro font-bold tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, '0')} / {String(INTRO_ORDER.length).padStart(2, '0')}
            </span>
          </div>

          <div
            key={step}
            className="flex flex-col gap-2.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
          >
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-neon/25 bg-neon/10">
                <Icon className="size-5 text-neon" weight="duotone" />
              </div>
              <DialogTitle className="font-heading text-2xl font-bold leading-tight tracking-tight">
                {t(copy.headline)}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base leading-relaxed text-muted-foreground">
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
              data-icon="inline-end"
              className="min-w-[9.5rem] font-semibold"
            >
              {isLast ? t('intro.cta') : t('intro.next')}
              <ArrowRight />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
