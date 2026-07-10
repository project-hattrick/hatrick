import type { ReactNode } from 'react';
import { SiteNavbar } from './site-navbar';
import { SiteFooter } from '@/components/home/site-footer';

interface PageShellProps {
  children: ReactNode;
  footer?: boolean;
}

/** Standard chrome for non-immersive routes: fixed navbar + padded main + footer. */
export function PageShell({ children, footer = true }: PageShellProps) {
  return (
    <div className="relative min-h-screen bg-background">
      <SiteNavbar />
      <main className="px-4 pt-24 pb-16 sm:px-6">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
      {footer ? <SiteFooter /> : null}
    </div>
  );
}
