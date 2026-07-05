'use client';

import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MetalButton } from '@/components/ui/metal-button';
import { Gift, Lightning, Sword, Broadcast } from '@/components/common/icons';
import { cn } from '@/lib/utils';
import { OnboardingStep, ONBOARDING_ORDER } from '@/enums/onboarding-step.enum';

import { PackStep } from './steps/pack-step';
import { SquadStep } from './steps/squad-step';
import { DoneStep } from './steps/done-step';
import type { OnboardingController } from './use-onboarding-controller';

const HEADINGS: Record<OnboardingStep, { title: string; description: string }> = {
  [OnboardingStep.Pack]: { title: 'Open your Starter Pack', description: 'A full eleven to start your collection.' },
  [OnboardingStep.Squad]: { title: 'Set your formation', description: 'Swap players and pick a shape, then lock it.' },
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
  /** Step machine + collection + formation editor state, owned by the host. */
  controller: OnboardingController;
  /** Leave the flow: mark onboarded, optionally navigate, and close the host dialog. */
  onExit: (path?: string) => void;
}

/**
 * The onboarding steps, rendered inside a host DialogContent (the login dialog on first sign-in,
 * or the dev/forced dialog). Presentational — the host owns the pack overlay and step state.
 * Reward first: pack → formation editor → done.
 */
export function OnboardingFlow({ controller, onExit }: OnboardingFlowProps) {
  const { collection, step, order, formations, formationIndex, formation, openPack, setFormation, swap, lockFormation } =
    controller;
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
        {step === OnboardingStep.Squad && (
          <SquadStep
            collection={collection}
            order={order}
            formations={formations}
            formationIndex={formationIndex}
            formation={formation}
            onSwap={swap}
            onSelectFormation={setFormation}
          />
        )}
        {step === OnboardingStep.Done && <DoneStep collection={collection} squadCount={order.length} />}
      </div>

      {step === OnboardingStep.Done ? (
        <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="outline" shape="pill" size="lg" className="h-12 w-full gap-2 text-base" onClick={() => onExit('/live')}>
            <Broadcast className="size-5" weight="fill" />
            Watch Live
          </Button>
          <MetalButton
            shape="pill"
            size="lg"
            strength={1}
            ringCssPx={3}
            metalFxClassName="w-full"
            className="h-12 w-full gap-2 text-base font-bold"
            onClick={() => onExit('/duelists')}
          >
            <Sword className="size-5" weight="fill" />
            Challenge a player
          </MetalButton>
        </DialogFooter>
      ) : (
        <DialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
          {step === OnboardingStep.Pack ? (
            <MetalButton shape="pill" size="lg" strength={1} ringCssPx={3} metalFxClassName="w-full" className="h-12 w-full gap-2 text-base font-bold" onClick={openPack}>
              <Gift className="size-4" weight="fill" />
              Open pack
            </MetalButton>
          ) : (
            <MetalButton
              shape="pill"
              size="lg"
              strength={1}
              ringCssPx={3}
              metalFxClassName="w-full"
              className="h-12 w-full gap-2 text-base font-bold"
              onClick={lockFormation}
              disabled={!order.length}
            >
              <Lightning className="size-4" weight="fill" />
              Lock formation
            </MetalButton>
          )}
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onExit()}>
            Skip for now
          </Button>
        </DialogFooter>
      )}
    </>
  );
}
