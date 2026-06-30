//! `initialize_market` — open escrow for a Live fixture-market or a Fantasy 1v1.

use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::{MARKET_SEED, VAULT_SEED};
use crate::state::{Market, MarketKind, MarketStatus};

#[derive(Accounts)]
#[instruction(market_id: [u8; 16])]
pub struct InitializeMarket<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Market::INIT_SPACE,
        seeds = [MARKET_SEED, market_id.as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,

    pub mint: Account<'info, Mint>,

    /// Escrow vault — a token account owned by the market PDA.
    #[account(
        init,
        payer = authority,
        seeds = [VAULT_SEED, market.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = market
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<InitializeMarket>,
    market_id: [u8; 16],
    kind: MarketKind,
    oracle: Pubkey,
    close_ts: i64,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    market.authority = ctx.accounts.authority.key();
    market.oracle = oracle;
    market.mint = ctx.accounts.mint.key();
    market.market_id = market_id;
    market.kind = kind;
    market.status = MarketStatus::Open;
    market.total_pool = 0;
    market.winning_pool = 0;
    market.winning_selection = [0u8; 32];
    market.merkle_root = [0u8; 32];
    market.result_hash = [0u8; 32];
    market.close_ts = close_ts;
    market.vault_bump = ctx.bumps.vault;
    market.bump = ctx.bumps.market;
    Ok(())
}
