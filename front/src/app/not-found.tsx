import Link from 'next/link';
import { PageShell } from '@/components/common/page-shell';
import { NotFoundCard } from '@/components/common/not-found-card';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <PageShell footer={false}>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-5 py-10 text-center">
        <NotFoundCard width={280} />
        <p className="text-sm text-muted-foreground">
          The match you’re looking for isn’t on the pitch — it may have been moved or never existed.
        </p>
        <Link href="/" className={buttonVariants({ variant: 'default' })}>
          Back to home
        </Link>
      </div>
    </PageShell>
  );
}
