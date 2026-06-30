# hat-trick / contracts — Anchor (Solana devnet)

Trustless escrow + settlement for **both** modes: Live Mode bets on real Copa
fixtures and Fantasy 1v1 wagers. One program, `hat_trick`.

> Independent app — **no cross-app imports**. The api (keeper) and front (wallet
> flow) consume this program by **vendoring the generated IDL** (`target/idl/hat_trick.json`)
> + the program id, never by importing from `contracts/`.

Program id (devnet, reserved): `6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J`

## Design decisions

- **Pari-mutuel, not fixed-odds.** Payout = `stake * total_pool / winning_pool`.
  There is no house — losers fund winners — so the escrow vault is **solvent by
  construction**. For a 1v1 this naturally becomes winner-takes-all. `odds_bps`
  on a position is display-only.
- **No CPI into TxLINE.** Settlement does **not** depend on a TxLINE on-chain
  program existing. The keeper caches the TxLINE-signed result and submits it
  with a native `Ed25519Program` instruction in the same transaction;
  `settle_market` binds that runtime-verified `(pubkey, message)` to the market's
  `oracle`. A keccak Merkle proof is checked against the result root for the
  "view proof" panel. (See `src/verify.rs`.)
- **Pull payments.** Winners `claim` individually, so settlement is O(1) in the
  number of winners (no compute-limit blowup paying N accounts).
- **Selections are opaque 32-byte hashes** = `keccak256(selection)` (e.g.
  `"Home"`, `"Over2.5"`, a playerId). The program is market-agnostic; the app
  owns the human ⇄ hash mapping.

## Instructions

| Instruction | Who | Effect |
|---|---|---|
| `initialize_market` | api authority | Creates the market PDA + escrow vault for a fixture-market or 1v1. |
| `place_position` | bettor (wallet) | Transfers SPL tokens into escrow; upserts the per-selection pool + the user's position. |
| `settle_market` | keeper (permissionless) | Verifies the oracle ed25519 signature + Merkle proof; locks the winning selection. |
| `claim` | winner (wallet) | Pulls the pari-mutuel share from escrow; closes the position. |

PDAs (seeds in `src/constants.rs`): `market[market_id]`, `vault[market]`,
`pool[market, selection]`, `position[market, owner, selection]`.

## Build / test / deploy

```bash
# toolchain: Solana CLI + Anchor (avm install latest && avm use latest)
cargo build-sbf            # compile the program (no Anchor CLI needed)
anchor build              # + generates IDL & TS types (target/idl, target/types)
anchor test               # local validator, runs tests/hat_trick.ts
anchor deploy --provider.cluster devnet
```

> The deploy keypair must match the program id above (`anchor keys sync` after
> dropping the reserved program keypair into the workspace). Keypairs are
> git-ignored — never commit them.

## Status

- [x] Program: `initialize_market` / `place_position` / `settle_market` / `claim` — **compiles to SBF**
- [x] On-chain ed25519 (oracle) + keccak Merkle verification
- [ ] Devnet deploy + vendored IDL into api/front
- [ ] Keeper bot (api) wired to `*.after` → `settle_market`
- [ ] Play-token mint + faucet
- [ ] Front: wallet `place_position` / `claim` + Merkle-proof panel
- [ ] Void/refund path for empty winning pools
