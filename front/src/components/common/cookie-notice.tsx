'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from '@/components/common/icons';
import { useCookieNoticeStore } from '@/store/cookie-notice.store';
import { useI18n, useT } from '@/i18n/i18n-provider';
import { localizePath } from '@/i18n/path';

/**
 * Non-blocking, one-time notice that informs users about essential cookies.
 */
export function CookieNotice() {
  const t = useT();
  const { locale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const acknowledged = useCookieNoticeStore((s) => s.acknowledged);
  const acknowledge = useCookieNoticeStore((s) => s.acknowledge);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  if (!mounted || acknowledged) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
      <div className="pointer-events-auto flex w-full max-w-2xl items-start gap-3 rounded-2xl border border-border/60 bg-popover/95 p-4 shadow-lg backdrop-blur">
        <Cookie className="mt-0.5 shrink-0 text-primary" size={20} weight="duotone" />
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
          {t('common.cookies.bodyPrefix')}{' '}
          <span className="text-foreground">{t('common.cookies.essentialOnly')}</span> -{' '}
          {t('common.cookies.bodySuffix')}{' '}
          <Link href={localizePath('/legal/cookies', locale)} className="text-primary underline-offset-2 hover:underline">
            {t('common.cookies.policy')}
          </Link>
        </p>
        <button
          type="button"
          onClick={acknowledge}
          aria-label={t('common.cookies.dismiss')}
          className="shrink-0 rounded-lg border border-transparent bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
        >
          {t('common.actions.gotIt')}
        </button>
        <button
          type="button"
          onClick={acknowledge}
          aria-label={t('common.aria.close')}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:text-foreground"
        >
          <X size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}
