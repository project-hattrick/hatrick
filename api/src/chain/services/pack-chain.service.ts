import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AcquisitionSource, PackType, SeedCommitContext } from '@prisma/client';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  createMint,
  mintTo,
} from '@solana/spl-token';
import { randomBytes, createHash, randomUUID } from 'node:crypto';

import { ChainConfig } from '../chain.config';
import { SolanaService } from './solana.service';
import { ProvablyFairService } from './provably-fair.service';
import { CardTypeEntry } from '../clients/packs.client';
import { OwnedCardRepository } from '../../fantasy/repositories/owned-card.repository';
import { CardRepository } from '../../fantasy/repositories/card.repository';
import { PrismaService } from '../../prisma/prisma.service';

function solanaSha256(inputs: Buffer[]): Buffer {
  const h = createHash('sha256');
  for (const b of inputs) h.update(b);
  return h.digest();
}

/**
 * Pack cards-per-pack constant per PackType.
 * Must stay in sync with fantasy.constants PACK_SPECS.size.
 */
const CARDS_PER_PACK: Record<PackType, number> = {
  [PackType.Welcome]: 11,
  [PackType.Standard]: 5,
  [PackType.Premium]: 11,
  [PackType.Special]: 11,
};

export interface OpenPackBuildResult {
  transaction: string;
  packOpenId: string;
  packMint: string;
  templateId: string;
  vaultCategories: string[];
}

export interface FulfillPackResult {
  cards: Array<{ ownedCardId: string; assetMint: string; realPlayerId: number }>;
  mintTxSig: string;
}

/**
 * On-chain pack lifecycle: initializeCategory → (mint pack token) → open_pack
 * (build-unsigned for user) → fulfillPack (layer-signed, mirrors OwnedCard rows).
 *
 * Boot-safe: all paths early-return / use mock values when SOLANA_ENABLED=false
 * so the existing off-chain PackService continues to work.
 */
@Injectable()
export class PackChainService {
  private readonly logger = new Logger(PackChainService.name);

  constructor(
    private readonly cfg: ChainConfig,
    private readonly solana: SolanaService,
    private readonly pf: ProvablyFairService,
    private readonly owned: OwnedCardRepository,
    private readonly cards: CardRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Admin helper: initialize on-chain category vaults from the card catalog.
   * Call once per templateId+category (idempotent by PDA existence on-chain).
   */
  async initializeCategory(params: {
    templateId: string;
    category: string;
    cardsPerPack: number;
    cardTypes: CardTypeEntry[];
  }): Promise<{ txSig: string }> {
    this.solana.ensureEnabled();
    const layer = this.cfg.layer();

    const ix = this.solana.packsClient.buildInitializeCategory({
      authority: layer.publicKey,
      templateId: params.templateId,
      category: params.category,
      cardsPerPack: params.cardsPerPack,
      metadataBaseUri: this.cfg.cardMetadataBaseUri,
      cardTypes: params.cardTypes,
    });

    const txSig = await this.solana.send([ix], [layer]);
    this.logger.log(
      `initializeCategory templateId=${params.templateId} category=${params.category} txSig=${txSig}`,
    );
    return { txSig };
  }

  /**
   * Mint 1 pack SPL token to the user's ATA so they hold a `user_pack_account`
   * that the on-chain open_pack can burn.
   */
  private async mintPackToken(
    packMint: PublicKey,
    userPk: PublicKey,
  ): Promise<{ userPackAccount: PublicKey; mintSig: string }> {
    const layer = this.cfg.layer();
    const ata = await getOrCreateAssociatedTokenAccount(
      this.solana.connection,
      layer,
      packMint,
      userPk,
    );
    const mintSig = await mintTo(
      this.solana.connection,
      layer,
      packMint,
      ata.address,
      layer,
      1n,
    );
    return { userPackAccount: ata.address, mintSig };
  }

  /**
   * Build the unsigned open_pack transaction for the user.
   * Side-effect: commits the provably-fair seed on-chain (layer-signed).
   *
   * @param userId      Prisma user id (resolved to wallet address internally).
   * @param templateId  UUID of the pack template (maps to category vaults).
   * @param packType    PackType enum value used to select vault category.
   * @returns base64 transaction + pack metadata so the front can sign + submit.
   */
  async buildOpenPack(
    userId: string,
    templateId: string,
    packType: PackType,
  ): Promise<OpenPackBuildResult> {
    if (!this.cfg.enabled) {
      return {
        transaction: 'chain-disabled',
        packOpenId: randomUUID(),
        packMint: '11111111111111111111111111111111',
        templateId,
        vaultCategories: ['common'],
      };
    }

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const userPk = new PublicKey(user.walletAddress);
    const layer = this.cfg.layer();

    // Derive the pack mint: a fresh mint keypair owned by the layer (one per pack type).
    // In a real deployment you'd have one persistent mint per PackType; for the hackathon
    // we create a fresh one per call (simple, no shared-mint bookkeeping needed).
    const packMintKp = Keypair.generate();
    const packMint = await createMint(
      this.solana.connection,
      layer,
      layer.publicKey,
      null,
      0, // 0 decimals — pack tokens are whole units
      packMintKp,
    );

    // Mint 1 pack token to user's ATA.
    const { userPackAccount } = await this.mintPackToken(packMint, userPk);

    // Decide vault categories for this pack type.
    const vaultCategories = this.vaultCategoriesFor(packType);

    // Generate a packOpenId and commit the provably-fair seed.
    const packOpenId = randomUUID();
    await this.pf.commit(packOpenId, SeedCommitContext.Pack);
    const seedRecord = this.solana.provablyFairClient.seedRecordPda(packOpenId);

    // Client seed: random 32 bytes (server-generated; front can substitute its own).
    const clientSeed = randomBytes(32);

    const ix = this.solana.packsClient.buildOpenPack({
      user: userPk,
      packMint,
      userPackAccount,
      seedRecord,
      templateId,
      packOpenId,
      clientSeed,
      vault0Category: vaultCategories.v0,
      vault1Category: vaultCategories.v1,
      vault2Category: vaultCategories.v2,
    });

    const transaction = await this.solana.buildUnsigned([ix], userPk);
    return {
      transaction,
      packOpenId,
      packMint: packMint.toBase58(),
      templateId,
      vaultCategories: [vaultCategories.v0, vaultCategories.v1, vaultCategories.v2].filter(
        (v): v is string => v !== undefined,
      ),
    };
  }

  /**
   * Fulfill a pack after the user's open_pack confirms on-chain.
   * 1. Reveal the provably-fair seed.
   * 2. Replay the RNG deterministically to know which players were picked.
   * 3. Layer-signed fulfill_pack (generates N cNFT assets via Metaplex Core).
   * 4. Mirror: create OwnedCard rows with assetMint set.
   */
  async fulfillPack(params: {
    userId: string;
    packOpenId: string;
    packMint: string;
    templateId: string;
    packType: PackType;
    packOpeningId: string;
  }): Promise<FulfillPackResult> {
    if (!this.cfg.enabled) {
      this.logger.debug(`chain disabled — skipping fulfillPack ${params.packOpenId}`);
      return { cards: [], mintTxSig: 'chain-disabled' };
    }

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: params.userId } });
    const userPk = new PublicKey(user.walletAddress);
    const packMint = new PublicKey(params.packMint);
    const layer = this.cfg.layer();

    // Reveal the seed — fulfill_pack gate requires is_revealed=true.
    await this.pf.reveal(params.packOpenId);

    // Load the on-chain vault(s) to get the card type state at this moment.
    const vaultCategories = this.vaultCategoriesFor(params.packType);
    const vault0 = await this.solana.getCategoryVault(params.templateId, vaultCategories.v0);
    if (!vault0) {
      throw new NotFoundException(
        `CategoryVault not found: ${params.templateId}/${vaultCategories.v0}`,
      );
    }

    const vault1 = vaultCategories.v1
      ? await this.solana.getCategoryVault(params.templateId, vaultCategories.v1)
      : null;
    const vault2 = vaultCategories.v2
      ? await this.solana.getCategoryVault(params.templateId, vaultCategories.v2)
      : null;

    // Replay RNG to determine which realPlayerIds will be picked.
    const serverSeed = await this.pf.getServerSeed(params.packOpenId);

    // Read client_seed from on-chain pack_request.
    const packRequest = await this.solana.getPackRequest(userPk, packMint);
    if (!packRequest) {
      throw new NotFoundException(`PackRequest not found for pack ${params.packMint}`);
    }
    const clientSeed = packRequest.clientSeed;

    const cardsPerPack = vault0.cardsPerPack;
    const pickedPlayerIds = this.replayRng(
      serverSeed,
      clientSeed,
      cardsPerPack,
      [
        [...vault0.cardTypes],
        vault1 ? [...vault1.cardTypes] : [],
        vault2 ? [...vault2.cardTypes] : [],
      ],
    );

    // Generate N fresh asset keypairs (one per card).
    const assetKeypairs = Array.from({ length: cardsPerPack }, () => Keypair.generate());
    const assetPubkeys = assetKeypairs.map((kp) => kp.publicKey);

    const seedRecord = this.solana.provablyFairClient.seedRecordPda(params.packOpenId);

    const ix = this.solana.packsClient.buildFulfillPack({
      layer: layer.publicKey,
      user: userPk,
      packMint,
      seedRecord,
      templateId: params.templateId,
      packOpenId: params.packOpenId,
      vault0Category: vaultCategories.v0,
      vault1Category: vaultCategories.v1,
      vault2Category: vaultCategories.v2,
      assetAccounts: assetPubkeys,
    });

    // layer + all asset keypairs must sign.
    const mintTxSig = await this.solana.send([ix], [layer, ...assetKeypairs]);
    this.logger.log(
      `fulfill_pack ${params.packOpenId} cardsPerPack=${cardsPerPack} txSig=${mintTxSig}`,
    );

    // Mirror: create OwnedCard rows for each minted player.
    const mirroredCards: FulfillPackResult['cards'] = [];
    for (let i = 0; i < pickedPlayerIds.length; i++) {
      const realPlayerId = pickedPlayerIds[i];
      const assetMint = assetPubkeys[i].toBase58();

      // Find the catalog card by realPlayerId.
      const catalogCards = await this.cards.findByRealPlayerId(realPlayerId);
      if (catalogCards.length === 0) {
        this.logger.warn(`No catalog card for realPlayerId=${realPlayerId} — skipping mirror`);
        continue;
      }
      const catalogCard = catalogCards[0];

      // Cast required until `prisma generate` runs with the new schema fields.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const oc = await this.owned.create({
        user: { connect: { id: params.userId } },
        card: { connect: { id: catalogCard.id } },
        acquiredVia: AcquisitionSource.Pack,
        packOpening: { connect: { id: params.packOpeningId } },
        assetMint,
        mintTxSig,
      } as any);

      mirroredCards.push({ ownedCardId: oc.id, assetMint, realPlayerId });
    }

    return { cards: mirroredCards, mintTxSig };
  }

  /**
   * Deterministic RNG replay — mirrors the Rust `pick_from_vault` logic exactly.
   * Uses `hashv(server_seed || client_seed || [i])` → u32 LE → pick % total_remaining.
   */
  private replayRng(
    serverSeed: Buffer,
    clientSeed: Buffer,
    cardsPerPack: number,
    vaultSnapshots: CardTypeEntry[][],
  ): number[] {
    // Work on mutable copies so we decrement remaining without touching the originals.
    const vaults: Array<Array<{ realPlayerId: number; remaining: number }>> = vaultSnapshots.map(
      (v) => v.map((e) => ({ realPlayerId: e.realPlayerId, remaining: e.remaining })),
    );

    const picked: number[] = [];

    for (let i = 0; i < cardsPerPack; i++) {
      const remaining0 = vaults[0].reduce((s, c) => s + c.remaining, 0);
      const remaining1 = (vaults[1] ?? []).reduce((s, c) => s + c.remaining, 0);
      const remaining2 = (vaults[2] ?? []).reduce((s, c) => s + c.remaining, 0);
      const totalRemaining = remaining0 + remaining1 + remaining2;

      if (totalRemaining === 0) break;

      const combined = solanaSha256([serverSeed, clientSeed, Buffer.from([i])]);
      const randomU32 = combined.readUInt32LE(0);
      const pick = randomU32 % totalRemaining;

      let chosenId: number | null = null;
      if (pick < remaining0) {
        chosenId = pickFromVault(vaults[0], pick);
      } else if (pick < remaining0 + remaining1) {
        chosenId = pickFromVault(vaults[1], pick - remaining0);
      } else {
        chosenId = pickFromVault(vaults[2], pick - remaining0 - remaining1);
      }

      if (chosenId !== null) picked.push(chosenId);
    }

    return picked;
  }

  private vaultCategoriesFor(
    packType: PackType,
  ): { v0: string; v1: string | undefined; v2: string | undefined } {
    // Mapping: Welcome/Standard = common only; Premium = common+rare; Special = common+rare+legendary.
    switch (packType) {
      case PackType.Premium:
        return { v0: 'common', v1: 'rare', v2: undefined };
      case PackType.Special:
        return { v0: 'common', v1: 'rare', v2: 'legendary' };
      default:
        return { v0: 'common', v1: undefined, v2: undefined };
    }
  }
}

function pickFromVault(
  cards: Array<{ realPlayerId: number; remaining: number }>,
  pick: number,
): number | null {
  let cumulative = 0;
  for (const card of cards) {
    cumulative += card.remaining;
    if (pick < cumulative) {
      card.remaining -= 1;
      return card.realPlayerId;
    }
  }
  return null;
}
