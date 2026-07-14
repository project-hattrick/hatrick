import { endpoints } from './endpoints';
import { api } from './http';
import type { CollectionCard } from './fantasy.service';

/** Discriminates the intent of a confirmed on-chain tx (drives backend side-effects). */
export enum ChainTxKind {
  Deposit = 'deposit',
  OpenPack = 'open_pack',
  Other = 'other',
}

export interface ChainBalance {
  playToken: string;
  usdc: string;
  walletAddress: string;
}

export interface FulfillCard {
  ownedCardId: string;
  assetMint: string;
  realPlayerId: string;
}

export interface FulfillResult {
  cards: FulfillCard[];
  mintTxSig: string;
}

export interface OpenPackBuildInput {
  templateId: string;
  packType: string;
  packOpeningId: string;
}

export interface OpenPackBuildResult {
  transaction: string;
  packOpenId: string;
  packMint: string;
  templateId: string;
  vaultCategories: string[];
}

export interface FulfillInput {
  packMint: string;
  templateId: string;
  packType: string;
  packOpeningId: string;
  /** Collection cards returned from the server (pre-mapped by the caller). */
  cards?: CollectionCard[];
}

/** Raw API callers for the on-chain endpoints. No fetch/axios — goes through api (http.ts). */
export const chainService = {
  balance: (): Promise<ChainBalance> =>
    api.get<ChainBalance>(endpoints.chain.balance),

  confirm: (signature: string, kind: ChainTxKind): Promise<{ confirmed: boolean; slot?: number }> =>
    api.post(endpoints.chain.confirm, { signature, kind }),

  buildDuelDeposit: (duelId: string, walletAddress: string): Promise<{ transaction: string }> =>
    api.post<{ transaction: string }>(endpoints.chain.duels.depositBuild(duelId), { walletAddress }),

  buildOpenPack: (input: OpenPackBuildInput): Promise<OpenPackBuildResult> =>
    api.post<OpenPackBuildResult>(endpoints.chain.packs.openBuild, input),

  fulfillPack: (packOpenId: string, input: Omit<FulfillInput, 'cards'>): Promise<FulfillResult> =>
    api.post<FulfillResult>(endpoints.chain.packs.fulfill(packOpenId), input),
};
