//! `claim` — a winning position pulls its pari-mutuel share out of escrow.
//! Pull-payment (not push) so settlement cost is O(1) regardless of #winners.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::constants::{MARKET_SEED, POOL_SEED, POSITION_SEED, VAULT_SEED};
use crate::error::HatTrickError;
use crate::state::{Market, MarketStatus, Position, SelectionPool};

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub winner: Signer<'info>,

    #[account(
        seeds = [MARKET_SEED, market.market_id.as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    #[account(
        seeds = [POOL_SEED, market.key().as_ref(), market.winning_selection.as_ref()],
        bump = winning_pool.bump,
    )]
    pub winning_pool: Account<'info, SelectionPool>,

    #[account(
        mut,
        close = winner,
        seeds = [POSITION_SEED, market.key().as_ref(), winner.key().as_ref(), market.winning_selection.as_ref()],
        bump = position.bump,
        constraint = position.owner == winner.key() @ HatTrickError::NotWinner,
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        seeds = [VAULT_SEED, market.key().as_ref()],
        bump = market.vault_bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = winner_token.owner == winner.key(),
        constraint = winner_token.mint == market.mint,
    )]
    pub winner_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Claim>) -> Result<()> {
    let market = &ctx.accounts.market;
    require!(market.status == MarketStatus::Settled, HatTrickError::MarketNotSettled);
    require!(!ctx.accounts.position.claimed, HatTrickError::AlreadyClaimed);
    require!(
        ctx.accounts.position.selection == market.winning_selection,
        HatTrickError::NotWinner
    );

    let winning_pool = ctx.accounts.winning_pool.amount;
    require!(winning_pool > 0, HatTrickError::EmptyWinningPool);

    // payout = stake * total_pool / winning_pool  (pari-mutuel, u128 to avoid overflow)
    let payout = (ctx.accounts.position.amount as u128)
        .checked_mul(market.total_pool as u128)
        .ok_or(HatTrickError::Overflow)?
        .checked_div(winning_pool as u128)
        .ok_or(HatTrickError::Overflow)? as u64;

    let market_id = market.market_id;
    let market_bump = market.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[MARKET_SEED, market_id.as_ref(), &[market_bump]]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.winner_token.to_account_info(),
                authority: ctx.accounts.market.to_account_info(),
            },
            signer_seeds,
        ),
        payout,
    )?;

    ctx.accounts.position.claimed = true;
    Ok(())
}
