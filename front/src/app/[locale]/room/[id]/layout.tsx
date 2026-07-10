import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/** Private rooms are invite-only — never indexed by search engines. */
export const metadata: Metadata = {
  title: 'Private room',
  robots: { index: false, follow: false },
};

export default function RoomLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
