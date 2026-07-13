use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("67QvSGTacjzuQFJujCREMWtRVonCLypqKmK2dszVdDwz");

#[program]
pub mod hattrick_fantasy {
    use super::*;

    pub fn initialize_duel(
        ctx: Context<InitializeDuel>,
        duel_id: String,
        stake_amount: u64,
        expire_ts: i64,
    ) -> Result<()> {
        instructions::initialize_duel::handler(ctx, duel_id, stake_amount, expire_ts)
    }

    pub fn deposit_stake(ctx: Context<DepositStake>, duel_id: String) -> Result<()> {
        instructions::deposit_stake::handler(ctx, duel_id)
    }

    pub fn settle_duel(
        ctx: Context<SettleDuel>,
        duel_id: String,
        winner: u8,
    ) -> Result<()> {
        instructions::settle_duel::handler(ctx, duel_id, winner)
    }

    pub fn cancel_duel(ctx: Context<CancelDuel>, duel_id: String) -> Result<()> {
        instructions::cancel_duel::handler(ctx, duel_id)
    }

    pub fn expire_duel(ctx: Context<ExpireDuel>, duel_id: String) -> Result<()> {
        instructions::expire_duel::handler(ctx, duel_id)
    }
}
