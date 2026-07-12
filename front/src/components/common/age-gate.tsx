'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, WarningOctagon, ArrowRight } from '@/components/common/icons';
import { useAgeGateStore } from '@/store/age-gate.store';
import { useI18n, useT } from '@/i18n/i18n-provider';
import { localizePath } from '@/i18n/path';

/** Free, confidential support lines surfaced when a user says they're under 18. */
const HELP_RESOURCES = [
  { label: 'GamCare', href: 'https://www.gamcare.org.uk' },
  { label: 'Gamblers Anonymous', href: 'https://www.gamblersanonymous.org' },
  { label: 'NCPG - 1-800-522-4700', href: 'https://www.ncpgambling.org' },
];

/** Blocking 18+ age gate for betting and prediction surfaces. */
export function AgeGate() {
  const t = useT();
  const { locale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const confirmedAdult = useAgeGateStore((s) => s.confirmedAdult);
  const confirm = useAgeGateStore((s) => s.confirm);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const open = mounted && !confirmedAdult;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        {blocked ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <WarningOctagon size={28} weight="duotone" className="shrink-0 text-destructive" />
              <DialogTitle>{t('common.ageGate.blockedTitle')}</DialogTitle>
            </div>
            <DialogDescription>{t('common.ageGate.blockedDescription')}</DialogDescription>
            <ul className="flex flex-col gap-2">
              {HELP_RESOURCES.map((resource) => (
                <li key={resource.href}>
                  <a
                    href={resource.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {resource.label}
                  </a>
                </li>
              ))}
            </ul>
            <Button variant="outline" shape="pill" onClick={() => setBlocked(false)}>
              {t('common.actions.goBack')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck size={28} weight="duotone" className="shrink-0 text-primary" />
              <DialogTitle>{t('common.ageGate.title')}</DialogTitle>
            </div>
            <DialogDescription>
              {t('common.ageGate.descriptionPrefix')}{' '}
              <span className="text-foreground">{t('common.ageGate.demo')}</span> -{' '}
              {t('common.ageGate.descriptionSuffix')}{' '}
              <Link href={localizePath('/legal/terms', locale)}>{t('common.ageGate.terms')}</Link>,{' '}
              <Link href={localizePath('/legal/privacy', locale)}>{t('common.ageGate.privacy')}</Link>,{' '}
              {t('common.ageGate.and')}{' '}
              <Link href={localizePath('/legal/responsible-gaming', locale)}>
                {t('common.ageGate.responsibleGaming')}
              </Link>{' '}
              {t('common.ageGate.policy')}
            </DialogDescription>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="ghost" shape="pill" onClick={() => setBlocked(true)}>
                {t('common.ageGate.under18')}
              </Button>
              <Button shape="pill" onClick={confirm} data-icon="inline-end">
                {t('common.ageGate.confirm')}
                <ArrowRight />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
