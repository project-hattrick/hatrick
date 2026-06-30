//! `place_position` — deposit SPL tokens into escrow backing one selection.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::constants::{MARKET_SEED, POOL_SEED, POSITION_SEED, VAULT_SEED};
use crate::error::HatTrickError;
use crate::state::{Market, MarketStatus, Position, SelectionPool};

#[derive(Accounts)]
#[instruction(selection: [u8; 32])]
pub struct PlacePosition<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,

    #[account(
        mut,
        seeds = [MARKET_SEED, market.market_id.as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [VAULT_SEED, market.key().as_ref()],
        bump = market.vault_bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = bettor,
        space = 8 + SelectionPool::INIT_SPACE,
        seeds = [POOL_SEED, market.key().as_ref(), selection.as_ref()],
        bump
    )]
    pub selection_pool: Account<'info, SelectionPool>,

    #[account(
        init_if_needed,
        payer = bettor,
        space = 8 + Position::INIT_SPACE,
        seeds = [POSITION_SEED, market.key().as_ref(), bettor.key().as_ref(), selection.as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        constraint = bettor_token.owner == bettor.key(),
        constraint = bettor_token.mint == market.mint,
    )]
    pub bettor_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<PlacePosition>,
    selection: [u8; 32],
    amount: u64,
    odds_bps: u32,
) -> Result<()> {
    require!(amount > 0, HatTrickError::ZeroAmount);

    let market = &ctx.accounts.market;
    require!(market.status == MarketStatus::Open, HatTrickError::MarketNotOpen);
    let now = Clock::get()?.unix_timestamp;
    require!(now < market.close_ts, HatTrickError::BettingClosed);

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.bettor_token.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.bettor.to_account_info(),
            },
        ),
        amount,
    )?;

    let market = &mut ctx.accounts.market;
    market.total_pool = market.total_pool.checked_add(amount).ok_or(HatTrickError::Overflow)?;

    let pool = &mut ctx.accounts.selection_pool;
    pool.market = market.key();
    pool.selection = selection;
    pool.amount = pool.amount.checked_add(amount).ok_or(HatTrickError::Overflow)?;
    pool.bump = ctx.bumps.selection_pool;

    let position = &mut ctx.accounts.position;
    position.market = market.key();
    position.owner = ctx.accounts.bettor.key();
    position.selection = selection;
    position.amount = position.amount.checked_add(amount).ok_or(HatTrickError::Overflow)?;
    position.odds_bps = odds_bps;
    position.claimed = false;
    position.bump = ctx.bumps.position;
    Ok(())
}
