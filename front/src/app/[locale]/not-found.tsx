'use client';

import Link from 'next/link';
import { PageShell } from '@/components/common/page-shell';
import { NotFoundCard } from '@/components/common/not-found-card';
import { buttonVariants } from '@/components/ui/button';
import { useLocalizedPath } from '@/hooks/use-localized-path';
import { useT } from '@/i18n/i18n-provider';

export default function NotFound() {
  const t = useT();
  const localizedPath = useLocalizedPath();

  return (
    <PageShell footer={false}>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-5 py-10 text-center">
        <NotFoundCard width={280} />
        <p className="text-sm text-muted-foreground">
          {t('errors.notFound')}
        </p>
        <Link href={localizedPath('/')} className={buttonVariants({ variant: 'default' })}>
          {t('common.backHome')}
        </Link>
      </div>
    </PageShell>
  );
}
