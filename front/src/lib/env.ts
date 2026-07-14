type SolanaCluster = 'devnet' | 'testnet' | 'mainnet-beta';

/** Public runtime config. Set via NEXT_PUBLIC_* (see .env.example). */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001',
  solanaCluster: (process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? 'devnet') as SolanaCluster,
  useMock: (process.env.NEXT_PUBLIC_USE_MOCK ?? 'true') === 'true',
  programId:
    process.env.NEXT_PUBLIC_HAT_TRICK_PROGRAM_ID ??
    '6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J',
  playTokenMint: process.env.NEXT_PUBLIC_PLAY_TOKEN_MINT ?? '',
  /** When true, on-chain Solana flows replace the play-money paths (bets, duel deposit, pack open). */
  chainEnabled: (process.env.NEXT_PUBLIC_CHAIN_ENABLED ?? 'false') === 'true',
} as const;
