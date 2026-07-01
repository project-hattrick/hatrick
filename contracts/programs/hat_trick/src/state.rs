//! On-chain accounts. Payout is **pari-mutuel** (pool-based): a winner receives
//! `stake * total_pool / winning_pool`. There is no house — losers fund winners,
//! so escrow is always solvent by construction. `odds_bps` is display-only.

use anchor_lang::prelude::*;

/// What a market resolves against.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum MarketKind {
    /// A real Copa fixture (Live Mode). Settled from a TxLINE-signed result.
    LiveMatch,
    /// A 1v1 Fantasy simulation. Settled from the match authority's signed result.
    Fantasy1v1,
}

/// Lifecycle of a market.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum MarketStatus {
    /// Accepting positions.
    Open,
    /// Result verified on-chain; winners may claim.
    Settled,
    /// Cancelled — positions refundable (reserved for a later slice).
    Voided,
}

/// A betting market for one fixture+market-type (Live) or one 1v1 match (Fantasy).
#[account]
#[derive(InitSpace)]
pub struct Market {
    /// Creator / admin (api service authority).
    pub authority: Pubkey,
    /// Ed25519 signer whose signature settles this market
    /// (TxLINE oracle key for Live, match-runner key for Fantasy).
    pub oracle: Pubkey,
    /// SPL mint escrowed by this market.
    pub mint: Pubkey,
    /// Opaque 16-byte id: e.g. fixtureId+MarketType (Live) or match UUID (Fantasy).
    pub market_id: [u8; 16],
    pub kind: MarketKind,
    pub status: MarketStatus,
    /// Total staked across every selection (escrow balance owed to winners).
    pub total_pool: u64,
    /// Stake backing the winning selection (set at settle, read by claim).
    pub winning_pool: u64,
    /// keccak256(selection bytes) that won. Zeroed until settled.
    pub winning_selection: [u8; 32],
    /// TxLINE result Merkle root — surfaced by the "view proof" UI.
    pub merkle_root: [u8; 32],
    /// keccak256 of the canonical settled-result message (audit anchor).
    pub result_hash: [u8; 32],
    /// Unix seconds: betting closes / earliest settle time.
    pub close_ts: i64,
    /// Seconds after `close_ts` before an unsettled market can be voided
    /// (funds refundable). Bounds the "oracle never settles" stuck-funds risk.
    pub void_delay: i64,
    pub vault_bump: u8,
    pub bump: u8,
}

/// Running total staked on one selection within a market.
#[account]
#[derive(InitSpace)]
pub struct SelectionPool {
    pub market: Pubkey,
    pub selection: [u8; 32],
    pub amount: u64,
    pub bump: u8,
}

/// One bettor's stake on one selection. Keyed by (market, owner, selection)
/// so a user can hold positions across several selections of the same market.
#[account]
#[derive(InitSpace)]
pub struct Position {
    pub market: Pubkey,
    pub owner: Pubkey,
    pub selection: [u8; 32],
    pub amount: u64,
    /// Decimal odds in basis points (e.g. 1.45 → 14_500). Display only.
    pub odds_bps: u32,
    pub claimed: bool,
    pub bump: u8,
}
