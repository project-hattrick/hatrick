'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import type { Adapter } from '@solana/wallet-adapter-base';
import { IconContext, type IconProps } from '@/components/common/icons';
import '@solana/wallet-adapter-react-ui/styles.css';

import { createQueryClient } from '@/lib/query-client';
import { solanaEndpoint } from '@/lib/solana';

/** Every Phosphor icon defaults to the duotone (two-tone filled) weight app-wide. */
const ICON_DEFAULTS: IconProps = { weight: 'duotone' };

/** App-wide providers: React Query + Solana wallet (devnet). */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  // Wallet Standard auto-detects Phantom/Solflare — no explicit adapters needed.
  const wallets = useMemo<Adapter[]>(() => [], []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={solanaEndpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <IconContext.Provider value={ICON_DEFAULTS}>{children}</IconContext.Provider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}
