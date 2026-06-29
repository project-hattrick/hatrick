'use client';

import Link from 'next/link';
import { WalletButton } from './wallet-button';

export function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <Link href="/" className="text-lg font-bold tracking-tight">
        Hat-trick
      </Link>
      <WalletButton />
    </header>
  );
}
