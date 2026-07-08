import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/** Duels are private sessions — never indexed by search engines. */
export const metadata: Metadata = {
  title: 'Duel',
  robots: { index: false, follow: false },
};

export default function DuelLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
