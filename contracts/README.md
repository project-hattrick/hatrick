# hat-trick / contracts — Anchor (Solana)

Four independent Anchor programs (0.31.1) handle betting, fantasy duels, card packs, and provably-fair seeds on Solana devnet. **These programs are read-only from the perspective of this repo** — the backend (NestJS) provides vendored clients (`project/api/src/chain/clients/`), so the app boots without Anchor tooling.

To deploy or test the programs, you need `solana` and `anchor` installed on Linux or WSL.

## Prerequisites

```bash
# macOS / Linux / WSL
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Solana 2.2.16
sh -c "$(curl -sSfL https://release.solana.com/v2.2.16/install)"
export PATH="/home/YOUR_USER/.local/share/solana/install/active_release/bin:$PATH"

# Anchor 0.31.1
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.31.1
avm use 0.31.1
```

Verify:
```bash
anchor --version     # Should output: anchor-cli 0.31.1
solana --version     # Should output: solana-cli 2.2.16
```

## Build

```bash
cd project/contracts
cargo build --release
anchor build --release
```

Outputs compiled binaries to `target/deploy/`:
- `hattrick_betting.so`
- `hattrick_fantasy.so`
- `hattrick_packs.so`
- `hattrick_provably_fair.so`

## Test

```bash
cd project/contracts
yarn install        # ts-mocha + Anchor test dependencies
yarn test           # Runs mocha against a local validator
```

Test files in `tests/`:
- `hattrick_betting.ts` — pari-mutuel markets, positions, settlement, claim.
- `hattrick_fantasy_escrow.ts` — duel init, deposits, settlement.
- `hattrick_packs.ts` — pack open, fulfill, cNFT minting.
- `hattrick_provably_fair.ts` — commit/reveal/close seeds.

## Deploy to Devnet

1. **Set up a Solana keypair** (or use an existing one):
   ```bash
   solana-keygen new -o ~/.config/solana/id.json
   solana-keygen show ~/.config/solana/id.json
   ```
   Fund it with devnet SOL:
   ```bash
   solana airdrop 5 --url devnet
   ```

2. **Deploy**:
   ```bash
   cd project/contracts
   anchor deploy --provider.cluster devnet
   ```

   **Output** — program ids for each of the four programs. Example:
   ```
   Program Log: "Deploying cluster: https://api.devnet.solana.com"
   ...
   Deploy success. Cluster: devnet.
   hattrick_betting: GhGZEarksLDfSDHg98PKm2xZuHJjSE8Zujd9mBB8zqXc (updated)
   hattrick_fantasy: 67QvSGTacjzuQFJujCREMWtRVonCLypqKmK2dszVdDwz (updated)
   hattrick_packs: BtgAtofxN8RJxaC824XUeamCZL13b63u2YaVTvhVGfFo (updated)
   hattrick_provably_fair: DsWff3P22AsnXAk7EthHNythzDWLc7bg5JS3aPpNjsLQ (updated)
   ```

3. **Update env files**:

   **`Anchor.toml`** (for future deploys):
   ```toml
   [programs.devnet]
   hattrick_betting = "GhGZEarksLDfSDHg98PKm2xZuHJjSE8Zujd9mBB8zqXc"
   hattrick_fantasy = "67QvSGTacjzuQFJujCREMWtRVonCLypqKmK2dszVdDwz"
   hattrick_packs = "BtgAtofxN8RJxaC824XUeamCZL13b63u2YaVTvhVGfFo"
   hattrick_provably_fair = "DsWff3P22AsnXAk7EthHNythzDWLc7bg5JS3aPpNjsLQ"
   ```

   **`project/api/.env`**:
   ```bash
   HATTRICK_BETTING_PROGRAM_ID=GhGZEarksLDfSDHg98PKm2xZuHJjSE8Zujd9mBB8zqXc
   HATTRICK_FANTASY_PROGRAM_ID=67QvSGTacjzuQFJujCREMWtRVonCLypqKmK2dszVdDwz
   HATTRICK_PACKS_PROGRAM_ID=BtgAtofxN8RJxaC824XUeamCZL13b63u2YaVTvhVGfFo
   HATTRICK_PROVABLY_FAIR_PROGRAM_ID=DsWff3P22AsnXAk7EthHNythzDWLc7bg5JS3aPpNjsLQ
   ```

   **`project/front/.env.local`** (for on-chain signing):
   ```bash
   NEXT_PUBLIC_CHAIN_ENABLED=true
   NEXT_PUBLIC_SOLANA_CLUSTER=devnet
   ```

4. **Verify on-chain**:
   ```bash
   solana program show GhGZEarksLDfSDHg98PKm2xZuHJjSE8Zujd9mBB8zqXc --url devnet
   solana program show 67QvSGTacjzuQFJujCREMWtRVonCLypqKmK2dszVdDwz --url devnet
   solana program show BtgAtofxN8RJxaC824XUeamCZL13b63u2YaVTvhVGfFo --url devnet
   solana program show DsWff3P22AsnXAk7EthHNythzDWLc7bg5JS3aPpNjsLQ --url devnet
   ```

## Program Overview

See [`docs/onchain-integration.md`](../../docs/onchain-integration.md) for:
- **Architecture**: chain-authoritative + DB mirror, keypair model.
- **Flows**: betting, duel, pack, seed oracle — UI through confirmation.
- **Env vars**: all 12+ settings for the backend and frontend.
- **Services**: NestJS services that build and submit transactions.
- **Debugging**: how to inspect on-chain state.

## Keypair Management

Three signers manage program state:

| Name | Purpose | Env Var | Set By |
|------|---------|---------|--------|
| **Mint Authority** | Mints play tokens; fallback layer | `SOLANA_MINT_AUTHORITY` | Backend `.env` |
| **Oracle** | Signs settlement merkles for betting | `SOLANA_ORACLE` | Backend `.env` |
| **Layer** | Authority for duels, packs, seed oracle | `SOLANA_LAYER` | Backend `.env` |

**Never commit real keypairs to `.env`.** Use file paths or inline JSON in `.env` (which is `.gitignore`d), or set them as deployment secrets.

## Workspace Layout

```
programs/
├── hattrick_betting/           Pari-mutuel markets
│   ├── src/lib.rs              declare_id!("GhGZEarksLDfSDHg98PKm2xZuHJjSE8Zujd9mBB8zqXc")
│   ├── src/instructions/       initialize_market, place_position, settle_market, claim, void, refund
│   ├── src/state/              Market, Position (Anchor accounts)
│   └── src/verify.rs           Merkle proof verification
├── hattrick_fantasy/           1v1 duel USDC escrow
│   ├── src/lib.rs              declare_id!("67QvSGTacjzuQFJujCREMWtRVonCLypqKmK2dszVdDwz")
│   ├── src/instructions/       initialize_duel, deposit_stake, settle_duel, cancel_duel, expire_duel
│   └── src/state/              DuelState (Anchor account)
├── hattrick_packs/             Card pack minting (cNFT)
│   ├── src/lib.rs              declare_id!("BtgAtofxN8RJxaC824XUeamCZL13b63u2YaVTvhVGfFo")
│   ├── src/instructions/       initialize_category, open_pack, fulfill_pack, restock_category, close_category
│   └── src/state/              CategoryVault, PackRequest (Anchor accounts)
└── hattrick_provably_fair/     Commit-reveal seed oracle
    ├── src/lib.rs              declare_id!("DsWff3P22AsnXAk7EthHNythzDWLc7bg5JS3aPpNjsLQ")
    ├── src/instructions/       commit_seed, commit_seed_pack, reveal_seed, close_record
    └── src/state/              SeedRecord (Anchor account)

tests/
├── hattrick_betting.ts
├── hattrick_fantasy_escrow.ts
├── hattrick_packs.ts
└── hattrick_provably_fair.ts

Cargo.toml                       Workspace members + release profile
Anchor.toml                      Program ids + cluster + wallet path
migrations/deploy.ts            Post-deploy instructions (see above)
```

## Local Testing (No Deploy)

If you only want to **test** without deploying to devnet:

```bash
cd project/contracts
# Start a local validator in a separate terminal
solana-test-validator &

# Run tests
yarn test
```

The test harness starts its own validator; no manual startup needed. Tests are deterministic and use fakes for system signers.

## Build-Disabled: Why No .so in the Repo

The `.so` binaries are **not** checked into git — only source (`.rs`, tests) and metadata (`Cargo.toml`, `Anchor.toml`). This keeps the repo lean and ensures fresh builds match your Rust toolchain.

To use the app with on-chain features, you must either:

1. Deploy yourself (see "Deploy to Devnet" above), or
2. Use the pre-deployed devnet ids (defaults in `project/api/.env`).

---

**Anchor version**: 0.31.1  
**Solana version**: 2.2.16  
**Last updated**: 2026-07-14
