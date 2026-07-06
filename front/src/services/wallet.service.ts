import { WalletTxType } from '@/enums';
import { endpoints } from './endpoints';
import { api } from './http';

/** Mirror of the api WalletTransactionDto (amounts are decimal strings). */
export interface WalletTransaction {
  id: string;
  type: WalletTxType;
  amount: string;
  balanceAfter: string;
  refType: string | null;
  refId: string | null;
  createdAt: string;
}

/** Read access to the signed-in user's coin ledger (guarded via the session cookie). */
export const walletService = {
  transactions: (signal?: AbortSignal): Promise<WalletTransaction[]> =>
    api.get<WalletTransaction[]>(endpoints.wallet.transactions, signal),
};
