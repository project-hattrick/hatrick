'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, WarningOctagon, ArrowRight } from '@/components/common/icons';
import { useAgeGateStore } from '@/store/age-gate.store';

/** Free, confidential support lines surfaced when a user says they're under 18. */
const HELP_RESOURCES = [
  { label: 'GamCare', href: 'https://www.gamcare.org.uk' },
  { label: 'Gamblers Anonymous', href: 'https://www.gamblersanonymous.org' },
  { label: 'NCPG — 1-800-522-4700', href: 'https://www.ncpgambling.org' },
];

/**
 * Blocking 18+ age gate for the betting/prediction surfaces, per the Responsible Gaming policy.
 * Non-dismissible: `open` is controlled and every close request (ESC / backdrop / X) is ignored
 * until the user confirms. Answering "under 18" doesn't persist — it shows help resources with a
 * way back — so a mis-click never permanently locks anyone out of a play-money devnet demo.
 *
 * Gated behind `mounted` because the confirmation lives in localStorage (persist): the server
 * can't know it, so we render nothing until the client rehydrates, avoiding a hydration mismatch.
 */
export function AgeGate() {
  const [mounted, setMounted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const confirmedAdult = useAgeGateStore((s) => s.confirmedAdult);
  const confirm = useAgeGateStore((s) => s.confirm);

  useEffect(() => setMounted(true), []);

  const open = mounted && !confirmedAdult;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        {blocked ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <WarningOctagon size={28} weight="duotone" className="shrink-0 text-destructive" />
              <DialogTitle>You must be 18 or older</DialogTitle>
            </div>
            <DialogDescription>
              Hat-trick's prediction and betting surfaces are strictly for adults aged 18+. You
              can't continue right now — but if gambling is affecting you or someone you know, free
              confidential support is available:
            </DialogDescription>
            <ul className="flex flex-col gap-2">
              {HELP_RESOURCES.map((r) => (
                <li key={r.href}>
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
            <Button variant="outline" shape="pill" onClick={() => setBlocked(false)}>
              Go back
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck size={28} weight="duotone" className="shrink-0 text-primary" />
              <DialogTitle>Are you 18 or older?</DialogTitle>
            </div>
            <DialogDescription>
              Hat-trick includes prediction and betting features intended for adults aged 18+. This
              is a <span className="text-foreground">play-money devnet demo</span> — tokens have no
              real-world value — but you still must meet the minimum age for your jurisdiction. By
              continuing you confirm you're 18 or older and agree to our{' '}
              <Link href="/legal/terms">Terms</Link>, <Link href="/legal/privacy">Privacy Policy</Link>,
              and <Link href="/legal/responsible-gaming">Responsible Gaming</Link> policy.
            </DialogDescription>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="ghost" shape="pill" onClick={() => setBlocked(true)}>
                I'm under 18
              </Button>
              <Button shape="pill" onClick={confirm} data-icon="inline-end">
                I'm 18+ &amp; I agree
                <ArrowRight />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
