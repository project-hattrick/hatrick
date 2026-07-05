'use client';

import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Lightning, Sword, House } from '@/components/common/icons';
import { cn } from '@/lib/utils';
import { OnboardingStep, ONBOARDING_ORDER } from '@/enums/onboarding-step.enum';

import { PackStep } from './steps/pack-step';
import { SquadStep } from './steps/squad-step';
import { DoneStep } from './steps/done-step';
import type { OnboardingController } from './use-onboarding-controller';

const HEADINGS: Record<OnboardingStep, { title: string; description: string }> = {
  [OnboardingStep.Pack]: { title: 'Open your Starter Pack', description: 'Five real cards to start your collection.' },
  [OnboardingStep.Squad]: { title: 'Set your formation', description: 'We lined up your best cards — lock it in.' },
  [OnboardingStep.Done]: { title: "You're in", description: 'Your squad is ready to play.' },
};

/** Slim progress dots — the one green accent in the chrome marks the active step. */
function StepDots({ index }: { index: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 pt-1">
      {ONBOARDING_ORDER.map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-[var(--duration-base)] ease-soft',
            i === index ? 'w-6 bg-neon' : 'w-1.5 bg-surface-3',
          )}
        />
      ))}
    </div>
  );
}

interface OnboardingFlowProps {
  /** Step machine + collection, owned by the host (see useOnboardingController). */
  controller: OnboardingController;
  /** Leave the flow: mark onboarded, optionally navigate, and close the host dialog. */
  onExit: (path?: string) => void;
}

/**
 * The onboarding steps, rendered inside a host DialogContent (the login dialog on first sign-in,
 * or the dev/forced dialog). Presentational — the host owns the pack overlay and step state so
 * hiding the dialog for the cinematic pull doesn't wipe progress. Reward first: pack → formation → done.
 */
export function OnboardingFlow({ controller, onExit }: OnboardingFlowProps) {
  const { collection, squad, step, openPack, lockFormation } = controller;
  const heading = HEADINGS[step];
  const stepIndex = ONBOARDING_ORDER.indexOf(step);

  return (
    <>
      <DialogHeader className="items-center pr-0 text-center">
        <DialogTitle>{heading.title}</DialogTitle>
        <DialogDescription>{heading.description}</DialogDescription>
        <StepDots index={stepIndex} />
      </DialogHeader>

      <div key={step} className="flex min-h-[300px] flex-col justify-center animate-in fade-in-0 zoom-in-95 duration-300">
        {step === OnboardingStep.Pack && <PackStep />}
        {step === OnboardingStep.Squad && <SquadStep collection={collection} />}
        {step === OnboardingStep.Done && <DoneStep collection={collection} squadCount={squad.length} />}
      </div>

      <DialogFooter className="items-center justify-between sm:justify-between">
        {step === OnboardingStep.Done ? (
          <>
            <Button variant="outline" shape="pill" className="w-full gap-2 sm:w-auto" onClick={() => onExit('/')}>
              <House className="size-4" weight="fill" />
              Explore
            </Button>
            <Button shape="pill" className="w-full gap-2 sm:w-auto" onClick={() => onExit('/duelists')}>
              <Sword className="size-4" weight="fill" />
              Challenge a friend
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onExit()}>
              Skip for now
            </Button>
            {step === OnboardingStep.Pack ? (
              <Button shape="pill" className="gap-2" onClick={openPack}>
                <Gift className="size-4" weight="fill" />
                Open pack
              </Button>
            ) : (
              <Button shape="pill" className="gap-2" onClick={lockFormation} disabled={!collection.length}>
                <Lightning className="size-4" weight="fill" />
                Lock formation
              </Button>
            )}
          </>
        )}
      </DialogFooter>
    </>
  );
}
