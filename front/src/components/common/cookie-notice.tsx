'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from '@/components/common/icons';
import { useCookieNoticeStore } from '@/store/cookie-notice.store';

/**
 * Non-blocking, one-time notice that we use essential cookies only. Not a consent gate:
 * the app ships strictly-necessary (auth) + functional (UI state) storage and no trackers,
 * which are exempt from consent — so this just informs and links to the full policy.
 *
 * Gated behind a `mounted` flag because dismissal lives in localStorage (persist): the
 * server can't know it, so we render nothing until the client has rehydrated to avoid a
 * hydration mismatch and a flash for users who already dismissed it.
 */
export function CookieNotice() {
  const [mounted, setMounted] = useState(false);
  const acknowledged = useCookieNoticeStore((s) => s.acknowledged);
  const acknowledge = useCookieNoticeStore((s) => s.acknowledge);

  useEffect(() => setMounted(true), []);

  if (!mounted || acknowledged) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
      <div className="pointer-events-auto flex w-full max-w-2xl items-start gap-3 rounded-2xl border border-border/60 bg-popover/95 p-4 shadow-lg backdrop-blur">
        <Cookie className="mt-0.5 shrink-0 text-primary" size={20} weight="duotone" />
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
          Hat-trick uses <span className="text-foreground">essential cookies only</span> — to keep
          you signed in and remember your preferences. No ad or tracking cookies.{' '}
          <Link href="/legal/cookies" className="text-primary underline-offset-2 hover:underline">
            Cookie Policy
          </Link>
        </p>
        <button
          type="button"
          onClick={acknowledge}
          aria-label="Dismiss cookie notice"
          className="shrink-0 rounded-lg border border-transparent bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Got it
        </button>
        <button
          type="button"
          onClick={acknowledge}
          aria-label="Close"
          className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:text-foreground"
        >
          <X size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}
