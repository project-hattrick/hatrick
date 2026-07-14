import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { clusterApiUrl, Keypair, PublicKey, type Cluster } from '@solana/web3.js';

/**
 * Default program ids — the devnet addresses declared in the four Anchor
 * programs (see each `project/contracts/programs/<name>/src/lib.rs`). Override per-env once
 * you (re)deploy and get fresh ids.
 */
const DEFAULT_BETTING_ID = 'GhGZEarksLDfSDHg98PKm2xZuHJjSE8Zujd9mBB8zqXc';
const DEFAULT_FANTASY_ID = '67QvSGTacjzuQFJujCREMWtRVonCLypqKmK2dszVdDwz';
const DEFAULT_PACKS_ID = 'BtgAtofxN8RJxaC824XUeamCZL13b63u2YaVTvhVGfFo';
const DEFAULT_PROVABLY_FAIR_ID = 'DsWff3P22AsnXAk7EthHNythzDWLc7bg5JS3aPpNjsLQ';
const DEFAULT_MPL_CORE_ID = 'CoreZaLvA6qNVdcbAgxdFegSKHudEQrqu6EPCfWQR9Hq';

/**
 * Typed accessor over SOLANA_* / HATTRICK_* env (see .env.example). Keypairs are
 * loaded lazily and only when a chain feature actually runs, so the app boots
 * cleanly with `SOLANA_ENABLED=false` and no secrets present.
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

  private pk(key: string, fallback: string): PublicKey {
    return new PublicKey(this.config.get<string>(key) ?? fallback);
  }

  /** hattrick_betting program id. */
  get bettingProgramId(): PublicKey {
    return this.pk('HATTRICK_BETTING_PROGRAM_ID', DEFAULT_BETTING_ID);
  }

  /** Back-compat alias used by the betting client / SolanaService. */
  get programId(): PublicKey {
    return this.bettingProgramId;
  }

  get fantasyProgramId(): PublicKey {
    return this.pk('HATTRICK_FANTASY_PROGRAM_ID', DEFAULT_FANTASY_ID);
  }

  get packsProgramId(): PublicKey {
    return this.pk('HATTRICK_PACKS_PROGRAM_ID', DEFAULT_PACKS_ID);
  }

  get provablyFairProgramId(): PublicKey {
    return this.pk('HATTRICK_PROVABLY_FAIR_PROGRAM_ID', DEFAULT_PROVABLY_FAIR_ID);
  }

  get mplCoreProgramId(): PublicKey {
    return this.pk('MPL_CORE_PROGRAM_ID', DEFAULT_MPL_CORE_ID);
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

  /** Base URI the packs program prefixes to each minted card's metadata. */
  get cardMetadataBaseUri(): string {
    return this.config.get<string>('CARD_METADATA_BASE_URI') ?? 'https://metadata.hattrick.app/cards/';
  }

  /** Configured play-token mint, or null to create one on first faucet use (dev). */
  playTokenMint(): PublicKey | null {
    const v = this.config.get<string>('PLAY_TOKEN_MINT');
    return v ? new PublicKey(v) : null;
  }

  /** USDC mint used for fantasy-duel escrow; defaults to the play-token mint. */
  usdcMint(): PublicKey | null {
    const v = this.config.get<string>('USDC_MINT');
    return v ? new PublicKey(v) : this.playTokenMint();
  }

  /** Mint + faucet authority (also pays ATA rent). */
  mintAuthority(): Keypair {
    return this.loadKeypair('SOLANA_MINT_AUTHORITY');
  }

  /** Oracle signer used by the keeper to settle betting markets. */
  oracle(): Keypair {
    return this.loadKeypair('SOLANA_ORACLE');
  }

  /**
   * The hattrick-layer keypair — the sole authority for fantasy duels, pack
   * vaults and the provably-fair seed oracle (commit/reveal/settle/fulfill).
   * Falls back to the mint authority if SOLANA_LAYER is unset.
   */
  layer(): Keypair {
    return this.config.get<string>('SOLANA_LAYER')
      ? this.loadKeypair('SOLANA_LAYER')
      : this.mintAuthority();
  }

  /** Accepts either an inline JSON secret array or a path to a keypair file. */
  private loadKeypair(key: string): Keypair {
    const raw = this.config.get<string>(key);
    if (!raw) throw new Error(`${key} is not set`);
    const json = raw.trim().startsWith('[') ? raw : readFileSync(raw.trim(), 'utf8');
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(json) as number[]));
  }
}
