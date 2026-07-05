'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { PackOpening } from '@/components/store/pack-opening';
import { Sparkle, Flag as FlagIcon, Gift, SoccerBall, Confetti } from '@/components/common/icons';
import type { Icon } from '@/components/common/icons';
import { OnboardingStep, ONBOARDING_ORDER } from '@/enums/onboarding-step.enum';
import { useAuth } from '@/services/queries/use-auth';
import { useProfileStore } from '@/store/profile.store';
import { useFantasyStore } from '@/store/fantasy.store';

import { WelcomeStep } from './steps/welcome-step';
import { FavoriteTeamStep } from './steps/favorite-team-step';
import { PackStep } from './steps/pack-step';
import { SquadStep } from './steps/squad-step';
import { DoneStep } from './steps/done-step';

const HEADINGS: Record<OnboardingStep, { title: string; description: string; icon: Icon }> = {
  [OnboardingStep.Welcome]: { title: 'Welcome to Hat-trick', description: 'A 60-second setup, then you play.', icon: Sparkle },
  [OnboardingStep.FavoriteTeam]: { title: 'Pick your team', description: 'Who are you repping this World Cup?', icon: FlagIcon },
  [OnboardingStep.Pack]: { title: 'Your free pack', description: 'On the house — go get your cards.', icon: Gift },
  [OnboardingStep.Squad]: { title: 'Build your XI', description: 'We lined up your best pulls.', icon: SoccerBall },
  [OnboardingStep.Done]: { title: "You're ready", description: 'Time to hit the pitch.', icon: Confetti },
};

/** Set the profile country without clobbering the other draft fields. */
function setFavoriteTeam(code: string) {
  const { save, displayName, username, bio, portraitSrc } = useProfileStore.getState();
  save({ displayName, username, country: code, bio, portraitSrc });
}

/**
 * First-login onboarding wizard: welcome → pick team → open free pack → build XI → done.
 * `open` gates the whole flow (owned by OnboardingMount); the pack step hands off to the
 * cinematic PackOpening overlay, so the dialog hides itself while that overlay is up.
 */
export function OnboardingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const country = useProfileStore((s) => s.country);
  const collection = useFantasyStore((s) => s.collection);
  const squad = useFantasyStore((s) => s.squad);
  const addToCollection = useFantasyStore((s) => s.addToCollection);
  const setSquad = useFantasyStore((s) => s.setSquad);

  const [step, setStep] = useState<OnboardingStep>(OnboardingStep.Welcome);
  const [packOpen, setPackOpen] = useState(false);

  const heading = HEADINGS[step];
  const stepIndex = ONBOARDING_ORDER.indexOf(step);
  const canSkip = step !== OnboardingStep.Done;

  const leaveTo = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  return (
    <>
      <Dialog open={open && !packOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <heading.icon className="size-5 text-neon" weight="fill" />
              {heading.title}
            </DialogTitle>
            <DialogDescription>{heading.description}</DialogDescription>
          </DialogHeader>

          <ProgressBar value={(stepIndex + 1) / ONBOARDING_ORDER.length} label="Onboarding progress" />

          <div key={step} className="animate-in fade-in-0 zoom-in-95 duration-300">
            {step === OnboardingStep.Welcome && (
              <WelcomeStep name={user?.displayName ?? undefined} onNext={() => setStep(OnboardingStep.FavoriteTeam)} />
            )}
            {step === OnboardingStep.FavoriteTeam && (
              <FavoriteTeamStep
                selected={country || undefined}
                onSelect={setFavoriteTeam}
                onNext={() => setStep(OnboardingStep.Pack)}
              />
            )}
            {step === OnboardingStep.Pack && <PackStep onOpenPack={() => setPackOpen(true)} />}
            {step === OnboardingStep.Squad && (
              <SquadStep
                collection={collection}
                onLock={(ids) => {
                  setSquad(ids);
                  setStep(OnboardingStep.Done);
                }}
              />
            )}
            {step === OnboardingStep.Done && (
              <DoneStep
                collectionCount={collection.length}
                squadCount={squad.length}
                onChallenge={() => leaveTo('/duelists')}
                onExplore={() => leaveTo('/')}
              />
            )}
          </div>

          {canSkip && (
            <DialogFooter className="sm:justify-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onOpenChange(false)}>
                Skip for now
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Cinematic pack reveal — launched from the Pack step; its pull seeds the collection. */}
      <PackOpening
        hideTrigger
        packName="Starter Pack"
        open={packOpen}
        onClose={() => setPackOpen(false)}
        onComplete={(cards) => {
          addToCollection(cards);
          setPackOpen(false);
          setStep(OnboardingStep.Squad);
        }}
      />
    </>
  );
}
