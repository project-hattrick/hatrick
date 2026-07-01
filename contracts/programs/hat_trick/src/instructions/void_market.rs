//! `void_market` — escape hatch when a market never settles. Permissionless:
//! after `close_ts + void_delay`, anyone may flip an Open market to Voided so
//! stakes become refundable. Bounds the "oracle offline / outcome unbettable"
//! stuck-funds risk.

use anchor_lang::prelude::*;

use crate::constants::MARKET_SEED;
use crate::error::HatTrickError;
use crate::state::{Market, MarketStatus};

#[derive(Accounts)]
pub struct VoidMarket<'info> {
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [MARKET_SEED, market.market_id.as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,
}

pub fn handler(ctx: Context<VoidMarket>) -> Result<()> {
    let market = &mut ctx.accounts.market;
    require!(market.status == MarketStatus::Open, HatTrickError::MarketNotOpen);

    let now = Clock::get()?.unix_timestamp;
    let void_at = market.close_ts.checked_add(market.void_delay).ok_or(HatTrickError::Overflow)?;
    require!(now >= void_at, HatTrickError::VoidTooEarly);

    market.status = MarketStatus::Voided;
    Ok(())
}
