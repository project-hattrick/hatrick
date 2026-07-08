'use client';

import { Warning } from '@/components/common/icons';
import { Button } from '@/components/ui/button';
import { useLocalizedPath } from '@/hooks/use-localized-path';
import { useT } from '@/i18n/i18n-provider';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Route-level error boundary (App Router). Must be a client component. */
export default function Error({ error, reset }: ErrorProps) {
  const t = useT();
  const localizedPath = useLocalizedPath();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Warning className="size-12 text-live" />
      <h1 className="text-title">{t('errors.title')}</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {t('errors.body')}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>{t('common.tryAgain')}</Button>
        <Button variant="outline" onClick={() => (window.location.href = localizedPath('/'))}>
          {t('common.goHome')}
        </Button>
      </div>
      {error.digest ? <span className="text-micro text-muted-foreground/60">ref: {error.digest}</span> : null}
    </div>
  );
}
