use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::constants::{MARKET_SEED, POSITION_SEED, VAULT_SEED};
use crate::error::HatTrickError;
use crate::state::{Market, MarketStatus, Position};

#[derive(Accounts)]
#[instruction(selection: [u8; 32])]
pub struct Refund<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [MARKET_SEED, market.market_id.as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        close = owner,
        seeds = [POSITION_SEED, market.key().as_ref(), owner.key().as_ref(), selection.as_ref()],
        bump = position.bump,
        constraint = position.owner == owner.key() @ HatTrickError::NotWinner,
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
        constraint = owner_token.owner == owner.key(),
        constraint = owner_token.mint == market.mint,
    )]
    pub owner_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Refund>, _selection: [u8; 32]) -> Result<()> {
    let market = &ctx.accounts.market;
    require!(market.status == MarketStatus::Voided, HatTrickError::MarketNotVoided);

    let amount      = ctx.accounts.position.amount;
    let market_id   = market.market_id;
    let market_bump = market.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[MARKET_SEED, market_id.as_ref(), &[market_bump]]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from:      ctx.accounts.vault.to_account_info(),
                to:        ctx.accounts.owner_token.to_account_info(),
                authority: ctx.accounts.market.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;
    Ok(())
}
