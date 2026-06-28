# hat-trick / contracts — Anchor (⏸ DEFERRED — Phase 2)

Not scaffolded yet, by decision. On-chain escrow + settlement via TxLINE's `validate_stat` CPI and the Merkle-proof UI are **Phase 2 / stretch**.

When reactivated:
- `anchor init` here; program `hat_trick` with `initialize_market` / `place_position` / `settle_market` (CPI into TxLINE `validate_stat`).
- Target **devnet** (program `6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J`); escrow a non-TxL asset (USDC / wrapped SOL).
- On-chain settlement reads TxLINE Merkle proofs and CPIs into `validate_stat` on devnet.

Until then, Solana's only presence is **wallet sign-in on the front**.
