'use client';

import dynamic from 'next/dynamic';

/** Wallet connect button — client-only to avoid SSR hydration issues. */
export const WalletButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false },
);
