use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod verify;

use instructions::*;

declare_id!("GhGZEarksLDfSDHg98PKm2xZuHJjSE8Zujd9mBB8zqXc");

#[program]
pub mod hattrick_betting {
    use super::*;

    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        market_id: [u8; 16],
        oracle: Pubkey,
        close_ts: i64,
        void_delay: i64,
    ) -> Result<()> {
        instructions::initialize_market::handler(ctx, market_id, oracle, close_ts, void_delay)
    }

    pub fn place_position(
        ctx: Context<PlacePosition>,
        selection: [u8; 32],
        amount: u64,
        odds_bps: u32,
    ) -> Result<()> {
        instructions::place_position::handler(ctx, selection, amount, odds_bps)
    }

    pub fn settle_market(
        ctx: Context<SettleMarket>,
        winning_selection: [u8; 32],
        merkle_root: [u8; 32],
        merkle_proof: Vec<[u8; 32]>,
    ) -> Result<()> {
        instructions::settle_market::handler(ctx, winning_selection, merkle_root, merkle_proof)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        instructions::claim::handler(ctx)
    }

    pub fn void_market(ctx: Context<VoidMarket>) -> Result<()> {
        instructions::void_market::handler(ctx)
    }

    pub fn refund(ctx: Context<Refund>, selection: [u8; 32]) -> Result<()> {
        instructions::refund::handler(ctx, selection)
    }
}
