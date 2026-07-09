'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { ShieldCheck, ShieldWarning, Clock } from '@/components/common/icons';
import { SelfExclusionStatus } from '@/enums/self-exclusion-status.enum';
import { useResponsibleGamingStore, selfExclusionStatus } from '@/store/responsible-gaming.store';

type ConfirmMode = 'exclude' | 'reactivate' | null;

/** Human-readable local date-time for the cooling-off deadline. */
function formatDeadline(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Self-exclusion control in the account Settings dialog, backing the Responsible Gaming policy. Effective
 * immediately, minimum 24h, and reactivation only after a cooling-off confirmation.
 * Rendered client-side once mounted (the deadline lives in localStorage).
 */
export function ResponsibleGamingPanel() {
  const excludedUntil = useResponsibleGamingStore((s) => s.excludedUntil);
  const exclude = useResponsibleGamingStore((s) => s.exclude);
  const reactivate = useResponsibleGamingStore((s) => s.reactivate);

  const [now, setNow] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<ConfirmMode>(null);
  useEffect(() => setNow(Date.now()), []);

  if (now === null) return null;

  const status = selfExclusionStatus(excludedUntil, now);

  function onExclude() {
    exclude();
    setConfirm(null);
    toast.success('Self-excluded from betting. Betting is paused for at least 24 hours.');
  }

  function onReactivate() {
    setConfirm(null);
    if (reactivate()) toast.success('Betting reactivated. Play responsibly.');
    else toast.error('The minimum self-exclusion period is still active.');
  }

  return (
    <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
      <SectionHeader
        title="Responsible gaming"
        action={
          <Link href="/legal/responsible-gaming" className="text-micro text-neon">
            Learn more
          </Link>
        }
      />

      <div className="flex flex-col gap-4 p-4 pt-0">
        {status === SelfExclusionStatus.Active && (
          <>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-neon" weight="duotone" />
              <p className="text-sm text-muted-foreground">
                Betting is <span className="text-foreground">active</span>. If you need a break, you
                can self-exclude from all staked betting — effective immediately, for a minimum of 24
                hours.
              </p>
            </div>
            <Button variant="destructive" className="w-full" onClick={() => setConfirm('exclude')}>
              Self-exclude from betting
            </Button>
          </>
        )}

        {status === SelfExclusionStatus.Excluded && excludedUntil !== null && (
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-5 shrink-0 text-neon" weight="duotone" />
            <p className="text-sm text-muted-foreground">
              You're <span className="text-foreground">self-excluded</span>. Betting is paused. You
              can reactivate after{' '}
              <span className="text-foreground">{formatDeadline(excludedUntil)}</span>, with a
              cooling-off confirmation.
            </p>
          </div>
        )}

        {status === SelfExclusionStatus.CoolingOff && (
          <>
            <div className="flex items-start gap-3">
              <ShieldWarning className="mt-0.5 size-5 shrink-0 text-neon" weight="duotone" />
              <p className="text-sm text-muted-foreground">
                Your minimum self-exclusion period is complete. You can reactivate betting whenever
                you're ready — please do so mindfully.
              </p>
            </div>
            <Button className="w-full" onClick={() => setConfirm('reactivate')}>
              Reactivate betting
            </Button>
          </>
        )}
      </div>

      <Dialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          {confirm === 'exclude' ? (
            <div className="flex flex-col gap-4">
              <DialogTitle>Self-exclude from betting?</DialogTitle>
              <DialogDescription>
                This takes effect immediately and lasts a minimum of 24 hours. You won't be able to
                place staked bets until you reactivate. Free predictions and the rest of Hat-trick
                stay available. Support is at{' '}
                <Link href="/legal/responsible-gaming">Responsible Gaming</Link>.
              </DialogDescription>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="ghost" shape="pill" onClick={() => setConfirm(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" shape="pill" onClick={onExclude}>
                  Confirm self-exclusion
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <DialogTitle>Reactivate betting?</DialogTitle>
              <DialogDescription>
                Your cooling-off period is complete. Reactivating restores access to staked betting.
                Only continue if you feel in control of your play.
              </DialogDescription>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="ghost" shape="pill" onClick={() => setConfirm(null)}>
                  Cancel
                </Button>
                <Button shape="pill" onClick={onReactivate}>
                  Yes, reactivate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </GlassPanel>
  );
}
