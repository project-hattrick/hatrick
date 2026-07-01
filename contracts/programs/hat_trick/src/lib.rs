//! hat_trick — trustless escrow & settlement for Hat-trick.
//!
//! One program serves both modes: Live Mode bets on real Copa fixtures and
//! Fantasy 1v1 wagers. Stakes sit in a per-market PDA vault (no custodian);
//! markets settle from an oracle-signed result verified on-chain, and winners
//! pull a pari-mutuel share. See `verify.rs` for the no-CPI settlement design.

use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod verify;

use instructions::*;
use state::MarketKind;

declare_id!("6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J");

#[program]
pub mod hat_trick {
    use super::*;

    /// Open a market and its escrow vault for a fixture-market or 1v1 match.
    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        market_id: [u8; 16],
        kind: MarketKind,
        oracle: Pubkey,
        close_ts: i64,
        void_delay: i64,
    ) -> Result<()> {
        initialize_market::handler(ctx, market_id, kind, oracle, close_ts, void_delay)
    }

    /// Stake `amount` tokens on `selection` (keccak256 of the human selection).
    pub fn place_position(
        ctx: Context<PlacePosition>,
        selection: [u8; 32],
        amount: u64,
        odds_bps: u32,
    ) -> Result<()> {
        place_position::handler(ctx, selection, amount, odds_bps)
    }

    /// Settle from an oracle-signed (and Merkle-proven) result.
    pub fn settle_market(
        ctx: Context<SettleMarket>,
        winning_selection: [u8; 32],
        merkle_root: [u8; 32],
        merkle_proof: Vec<[u8; 32]>,
    ) -> Result<()> {
        settle_market::handler(ctx, winning_selection, merkle_root, merkle_proof)
    }

    /// Claim a winning position's pari-mutuel payout from escrow.
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        claim::handler(ctx)
    }

    /// Void an Open market once `close_ts + void_delay` has passed (escape hatch).
    pub fn void_market(ctx: Context<VoidMarket>) -> Result<()> {
        void_market::handler(ctx)
    }

    /// Refund a position's exact stake from a voided market.
    pub fn refund(ctx: Context<Refund>, selection: [u8; 32]) -> Result<()> {
        refund::handler(ctx, selection)
    }
}
