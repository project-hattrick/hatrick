'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import type { Adapter } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { IconContext, type IconProps } from '@/components/common/icons';
import { WalletAuthSync } from '@/components/common/wallet-auth-sync';
import { SearchCommand } from '@/components/common/search-command';
import { LoginMount } from '@/components/common/login-mount';
import { ChallengeMount } from '@/components/duel/challenge-mount';
import { OnboardingMount } from '@/components/onboarding/onboarding-mount';
import { BetSettlementMount } from '@/components/live/bet-settlement-mount';
import '@solana/wallet-adapter-react-ui/styles.css';

import { createQueryClient } from '@/lib/query-client';
import { solanaEndpoint } from '@/lib/solana';
import { I18nProvider } from '@/i18n/i18n-provider';
import type { Dictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/locales';

/** Every Phosphor icon defaults to the duotone (two-tone filled) weight app-wide. */
const ICON_DEFAULTS: IconProps = { weight: 'duotone' };

/** App-wide providers: React Query + Solana wallet (devnet). */
export function AppProviders({
  children,
  locale,
  dictionary,
}: {
  children: ReactNode;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const [queryClient] = useState(createQueryClient);
  // Wallet Standard auto-detects Phantom/Solflare on desktop with the extension.
  // On mobile browsers nothing is injected, so we register the explicit Phantom
  // adapter: it reports `Loadable` and, on connect, deep-links into Phantom's
  // in-app browser (where the provider IS injected and the sign-in flow resumes).
  // WalletProvider dedupes it against the Standard entry, so desktop shows one row.
  const wallets = useMemo<Adapter[]>(() => [new PhantomWalletAdapter()], []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={solanaEndpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <WalletAuthSync />
            <I18nProvider locale={locale} dictionary={dictionary}>
              <IconContext.Provider value={ICON_DEFAULTS}>
                {children}
                <SearchCommand />
                <LoginMount />
                <ChallengeMount />
                <OnboardingMount />
                <BetSettlementMount />
              </IconContext.Provider>
            </I18nProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}
