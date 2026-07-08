'use client';

import { Warning } from '@/components/common/icons';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Route-level error boundary (App Router). Must be a client component. */
export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Warning className="size-12 text-live" />
      <h1 className="text-title">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        An unexpected error occurred while loading this view. You can try again or head back home.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => (window.location.href = '/')}>
          Go home
        </Button>
      </div>
      {error.digest ? <span className="text-micro text-muted-foreground/60">ref: {error.digest}</span> : null}
    </div>
  );
}
