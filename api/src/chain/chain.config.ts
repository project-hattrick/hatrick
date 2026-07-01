import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { clusterApiUrl, Keypair, PublicKey, type Cluster } from '@solana/web3.js';

/** Program id reserved on devnet for `hat_trick` (see contracts/). */
const RESERVED_PROGRAM_ID = '6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J';

/**
 * Typed accessor over SOLANA_* env (see .env.example). Keypairs are loaded
 * lazily and only when a chain feature actually runs, so the app boots cleanly
 * with `SOLANA_ENABLED=false` and no secrets present.
 */
@Injectable()
export class ChainConfig {
  constructor(private readonly config: ConfigService) {}

  get enabled(): boolean {
    return this.config.get<string>('SOLANA_ENABLED') === 'true';
  }

  get cluster(): Cluster {
    return (this.config.get<string>('SOLANA_CLUSTER') ?? 'devnet') as Cluster;
  }

  get rpcUrl(): string {
    return this.config.get<string>('SOLANA_RPC_URL') ?? clusterApiUrl(this.cluster);
  }

  get programId(): PublicKey {
    return new PublicKey(this.config.get<string>('HAT_TRICK_PROGRAM_ID') ?? RESERVED_PROGRAM_ID);
  }

  get playTokenDecimals(): number {
    return Number(this.config.get<string>('PLAY_TOKEN_DECIMALS') ?? '6');
  }

  /** Faucet grant in whole tokens (converted to base units by the faucet). */
  get faucetAmount(): number {
    return Number(this.config.get<string>('FAUCET_AMOUNT') ?? '1000');
  }

  /** Seconds after close_ts before an unsettled market can be voided (default 3h). */
  get voidDelaySeconds(): number {
    return Number(this.config.get<string>('VOID_DELAY_SECONDS') ?? '10800');
  }

  /** Configured play-token mint, or null to create one on first faucet use (dev). */
  playTokenMint(): PublicKey | null {
    const v = this.config.get<string>('PLAY_TOKEN_MINT');
    return v ? new PublicKey(v) : null;
  }

  /** Mint + faucet authority (also pays ATA rent). */
  mintAuthority(): Keypair {
    return this.loadKeypair('SOLANA_MINT_AUTHORITY');
  }

  /** Oracle signer used by the keeper to settle markets (Phase B keeper slice). */
  oracle(): Keypair {
    return this.loadKeypair('SOLANA_ORACLE');
  }

  /** Accepts either an inline JSON secret array or a path to a keypair file. */
  private loadKeypair(key: string): Keypair {
    const raw = this.config.get<string>(key);
    if (!raw) throw new Error(`${key} is not set`);
    const json = raw.trim().startsWith('[') ? raw : readFileSync(raw.trim(), 'utf8');
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(json) as number[]));
  }
}
