import Link from 'next/link';
import { PageShell } from '@/components/common/page-shell';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <PageShell footer={false}>
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center">
        <span className="text-7xl font-black tracking-tight text-neon">404</span>
        <h1 className="text-xl font-bold">Page not found</h1>
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
