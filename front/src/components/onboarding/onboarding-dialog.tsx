'use client';

import { useRouter } from 'next/navigation';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PackOpening } from '@/components/store/pack-opening';
import { cn } from '@/lib/utils';
import { OnboardingStep } from '@/enums/onboarding-step.enum';
import { OnboardingFlow } from './onboarding-flow';
import { useOnboardingController, STARTER_PACK_SIZE } from './use-onboarding-controller';

/** How the modal grows so the pack plays inside it instead of taking over the screen. */
const EXPANDED = 'h-[92vh] w-[92vw] max-w-[92vw] overflow-hidden p-0 sm:max-w-[92vw] sm:p-0';
const NORMAL = 'max-h-[calc(100dvh-2rem)] overflow-y-auto';

/**
 * Standalone host for the onboarding flow — used by the dev trigger. Same behaviour as the
 * login-dialog fusion: opening the pack expands this modal and plays the reveal embedded.
 */
export function OnboardingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const controller = useOnboardingController();
  const packing = controller.packOpen;

  const exit = (path?: string) => {
    onOpenChange(false);
    if (path) router.push(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={!packing}
        className={cn(
          'transition-[width,height,max-width,padding] duration-300 ease-soft',
          packing ? EXPANDED : NORMAL,
          !packing && controller.step === OnboardingStep.Squad && 'sm:max-w-3xl',
        )}
      >
        {packing ? (
          <>
            <DialogTitle className="sr-only">Opening your Starter Pack</DialogTitle>
            <PackOpening
              embedded
              hideTrigger
              open
              packName="Starter Pack"
              packSize={STARTER_PACK_SIZE}
              onClose={controller.closePack}
              onComplete={controller.completePack}
            />
          </>
        ) : (
          <OnboardingFlow controller={controller} onExit={exit} />
        )}
      </DialogContent>
    </Dialog>
  );
}
