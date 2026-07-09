'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { CircleNotch } from '@/components/common/icons';
import { WalletTxType } from '@/enums';
import { useWalletTransactions } from '@/services/queries/use-wallet-transactions';
import { useAuth } from '@/services/queries/use-auth';
import { formatThousands } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { WalletTransaction } from '@/services/wallet.service';

/** Human labels for each ledger movement (avoids raw enum values in the UI). */
const TX_LABELS: Record<WalletTxType, string> = {
  [WalletTxType.WelcomeGrant]: 'Welcome grant',
  [WalletTxType.Faucet]: 'Faucet',
  [WalletTxType.PackPurchase]: 'Pack purchase',
  [WalletTxType.MarketSale]: 'Market sale',
  [WalletTxType.MarketPurchase]: 'Market purchase',
  [WalletTxType.BetStake]: 'Bet stake',
  [WalletTxType.BetPayout]: 'Bet payout',
  [WalletTxType.BetRefund]: 'Bet refund',
  [WalletTxType.DuelStake]: 'Duel stake',
  [WalletTxType.DuelReward]: 'Duel reward',
  [WalletTxType.Adjustment]: 'Adjustment',
};

const dateFmt = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });

function TxRow({ tx }: { tx: WalletTransaction }) {
  const amount = Number(tx.amount);
  const isCredit = amount >= 0;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{TX_LABELS[tx.type] ?? tx.type}</span>
        <span className="text-micro text-muted-foreground">
          {dateFmt.format(new Date(tx.createdAt))}
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span className={cn('font-mono text-sm font-bold tabular-nums', isCredit ? 'text-neon' : 'text-hot')}>
          {isCredit ? '+' : '−'}
          {formatThousands(Math.abs(amount))}
        </span>
        <span className="text-micro text-muted-foreground tabular-nums">
          {formatThousands(Number(tx.balanceAfter))}
        </span>
      </div>
    </div>
  );
}

/** Server-backed coin ledger for the signed-in profile (GET /wallet/transactions). */
export function WalletActivity() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isError } = useWalletTransactions();
  const rows = data?.slice(0, 6) ?? [];

  return (
    <GlassPanel radius="xl" tone="surface" className="flex flex-col overflow-hidden">
      <SectionHeader
        title="Wallet activity"
        action={<span className="text-micro text-muted-foreground">coins · devnet</span>}
      />
      {!isAuthenticated ? (
        <p className="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground">
          Sign in to see your coin ledger.
        </p>
      ) : isLoading ? (
        <div className="flex flex-1 items-center justify-center py-8 text-muted-foreground">
          <CircleNotch className="size-5 animate-spin" />
        </div>
      ) : isError ? (
        <p className="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground">
          Couldn&apos;t load your wallet activity.
        </p>
      ) : rows.length ? (
        <div className="flex flex-col divide-y divide-border/30">
          {rows.map((tx) => (
            <TxRow key={tx.id} tx={tx} />
          ))}
        </div>
      ) : (
        <p className="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground">
          No activity yet.
        </p>
      )}
    </GlassPanel>
  );
}
