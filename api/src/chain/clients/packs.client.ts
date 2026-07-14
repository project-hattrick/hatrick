/**
 * Vendored client for the `hattrick_packs` program (raw web3.js, no IDL).
 * Mirrors `project/contracts/programs/hattrick_packs/src/*`.
 *
 * Provably-fair card packs. The backend layer keypair owns category vaults and
 * fulfils packs (minting Metaplex Core assets to the user). The user signs
 * `open_pack` (burns their pack token + commits their client_seed); after the
 * layer reveals the seed, `fulfill_pack` mints one cNFT per card.
 *
 * Anchor optional-account convention: a `None` Option<Account> is encoded by
 * passing the program's own id in that slot (see open_pack/fulfill_pack).
 */
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { Cursor, disc, meta, str, u16, u32, u8, vec } from './encoding';

const CATEGORY_VAULT = Buffer.from('category_vault');
const PACK_REQUEST = Buffer.from('pack_request');

/** Canonical Metaplex Core program id (override via MPL_CORE_PROGRAM_ID). */
export const MPL_CORE_PROGRAM_ID = new PublicKey('CoreZaLvA6qNVdcbAgxdFegSKHudEQrqu6EPCfWQR9Hq');

export interface CardTypeEntry {
  realPlayerId: number;
  initialSupply: number;
  remaining: number;
}

export interface CategoryVaultAccount {
  templateId: string;
  category: string;
  isClosed: boolean;
  authority: PublicKey;
  cardsPerPack: number;
  metadataBaseUri: string;
  bump: number;
  cardTypes: CardTypeEntry[];
}

export interface PackRequestAccount {
  user: PublicKey;
  packMint: PublicKey;
  clientSeed: Buffer;
  packOpenId: string;
  templateId: string;
  vault0: PublicKey;
  vault1: PublicKey;
  vault2: PublicKey;
  vaultCount: number;
  isPending: boolean;
  bump: number;
}

const encodeCardType = (c: CardTypeEntry): Buffer =>
  Buffer.concat([u32(c.realPlayerId), u16(c.initialSupply), u16(c.remaining)]);

export class HatTrickPacksClient {
  constructor(
    private readonly programId: PublicKey,
    private readonly mplCoreProgramId: PublicKey = MPL_CORE_PROGRAM_ID,
  ) {}

  categoryVaultPda(templateId: string, category: string): PublicKey {
    return PublicKey.findProgramAddressSync(
      [CATEGORY_VAULT, Buffer.from(templateId, 'utf8'), Buffer.from(category, 'utf8')],
      this.programId,
    )[0];
  }

  packRequestPda(user: PublicKey, packMint: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [PACK_REQUEST, user.toBuffer(), packMint.toBuffer()],
      this.programId,
    )[0];
  }

  /** None optional account → the program id placeholder. */
  private optional(pk: PublicKey | null, writable: boolean) {
    return pk ? meta(pk, false, writable) : meta(this.programId, false, false);
  }

  /** initialize_category(...) — layer/authority-signed vault seeding. */
  buildInitializeCategory(params: {
    authority: PublicKey;
    templateId: string;
    category: string;
    cardsPerPack: number;
    metadataBaseUri: string;
    cardTypes: CardTypeEntry[];
  }): TransactionInstruction {
    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        meta(params.authority, true, true),
        meta(this.categoryVaultPda(params.templateId, params.category), false, true),
        meta(SystemProgram.programId, false, false),
      ],
      data: Buffer.concat([
        disc('initialize_category'),
        str(params.templateId),
        str(params.category),
        u8(params.cardsPerPack),
        str(params.metadataBaseUri),
        vec(params.cardTypes, encodeCardType),
      ]),
    });
  }

  /** open_pack(template_id, pack_open_id, client_seed) — signed by the user. */
  buildOpenPack(params: {
    user: PublicKey;
    packMint: PublicKey;
    userPackAccount: PublicKey;
    seedRecord: PublicKey;
    templateId: string;
    packOpenId: string;
    clientSeed: Buffer;
    vault0Category: string;
    vault1Category?: string;
    vault2Category?: string;
  }): TransactionInstruction {
    const v0 = this.categoryVaultPda(params.templateId, params.vault0Category);
    const v1 = params.vault1Category
      ? this.categoryVaultPda(params.templateId, params.vault1Category)
      : null;
    const v2 = params.vault2Category
      ? this.categoryVaultPda(params.templateId, params.vault2Category)
      : null;
    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        meta(params.user, true, true),
        meta(v0, false, true),
        this.optional(v1, true),
        this.optional(v2, true),
        meta(params.packMint, false, true),
        meta(params.userPackAccount, false, true),
        meta(params.seedRecord, false, false),
        meta(this.packRequestPda(params.user, params.packMint), false, true),
        meta(SystemProgram.programId, false, false),
        meta(TOKEN_PROGRAM_ID, false, false),
      ],
      data: Buffer.concat([
        disc('open_pack'),
        str(params.templateId),
        str(params.packOpenId),
        params.clientSeed,
      ]),
    });
  }

  /**
   * fulfill_pack(template_id, pack_open_id) — layer-signed. `assetAccounts` are
   * fresh keypairs (one per card) that must also sign the transaction; each is
   * created as a Metaplex Core asset owned by the user.
   */
  buildFulfillPack(params: {
    layer: PublicKey;
    user: PublicKey;
    packMint: PublicKey;
    seedRecord: PublicKey;
    templateId: string;
    packOpenId: string;
    vault0Category: string;
    vault1Category?: string;
    vault2Category?: string;
    assetAccounts: PublicKey[];
  }): TransactionInstruction {
    const v0 = this.categoryVaultPda(params.templateId, params.vault0Category);
    const v1 = params.vault1Category
      ? this.categoryVaultPda(params.templateId, params.vault1Category)
      : null;
    const v2 = params.vault2Category
      ? this.categoryVaultPda(params.templateId, params.vault2Category)
      : null;
    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        meta(params.layer, true, true),
        meta(params.user, false, false),
        meta(this.packRequestPda(params.user, params.packMint), false, true),
        meta(v0, false, true),
        this.optional(v1, true),
        this.optional(v2, true),
        meta(params.seedRecord, false, false),
        meta(this.mplCoreProgramId, false, false),
        meta(SystemProgram.programId, false, false),
        // remaining_accounts: one writable signer asset account per card
        ...params.assetAccounts.map((a) => meta(a, true, true)),
      ],
      data: Buffer.concat([disc('fulfill_pack'), str(params.templateId), str(params.packOpenId)]),
    });
  }

  /** restock_category(template_id, category, entries) — authority-signed. */
  buildRestockCategory(params: {
    authority: PublicKey;
    templateId: string;
    category: string;
    entries: { realPlayerId: number; addSupply: number }[];
  }): TransactionInstruction {
    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        meta(params.authority, true, true),
        meta(this.categoryVaultPda(params.templateId, params.category), false, true),
      ],
      data: Buffer.concat([
        disc('restock_category'),
        str(params.templateId),
        str(params.category),
        vec(params.entries, (e) => Buffer.concat([u32(e.realPlayerId), u16(e.addSupply)])),
      ]),
    });
  }

  /** close_category(template_id, category) — authority-signed (sets is_closed). */
  buildCloseCategory(params: {
    authority: PublicKey;
    templateId: string;
    category: string;
  }): TransactionInstruction {
    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        meta(params.authority, true, true),
        meta(this.categoryVaultPda(params.templateId, params.category), false, true),
      ],
      data: Buffer.concat([disc('close_category'), str(params.templateId), str(params.category)]),
    });
  }

  static decodeCategoryVault(data: Buffer): CategoryVaultAccount {
    const c = new Cursor(data);
    const templateId = c.str();
    const category = c.str();
    const isClosed = c.bool();
    const authority = c.pubkey();
    const cardsPerPack = c.u8();
    const metadataBaseUri = c.str();
    const bump = c.u8();
    const len = c.u32();
    const cardTypes: CardTypeEntry[] = [];
    for (let i = 0; i < len; i++) {
      cardTypes.push({ realPlayerId: c.u32(), initialSupply: c.u16(), remaining: c.u16() });
    }
    return { templateId, category, isClosed, authority, cardsPerPack, metadataBaseUri, bump, cardTypes };
  }

  static decodePackRequest(data: Buffer): PackRequestAccount {
    const c = new Cursor(data);
    return {
      user: c.pubkey(),
      packMint: c.pubkey(),
      clientSeed: c.bytes(32),
      packOpenId: c.str(),
      templateId: c.str(),
      vault0: c.pubkey(),
      vault1: c.pubkey(),
      vault2: c.pubkey(),
      vaultCount: c.u8(),
      isPending: c.bool(),
      bump: c.u8(),
    };
  }
}
