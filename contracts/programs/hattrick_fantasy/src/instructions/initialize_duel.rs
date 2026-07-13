use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::DuelState;

pub fn handler(
    ctx: Context<InitializeDuel>,
    duel_id: String,
    stake_amount: u64,
    expire_ts: i64,
) -> Result<()> {
    let duel = &mut ctx.accounts.duel_state;
    duel.duel_id          = duel_id;
    duel.layer            = ctx.accounts.layer.key();
    duel.team_a           = ctx.accounts.team_a.key();
    duel.team_b           = ctx.accounts.team_b.key();
    duel.team_a_usdc      = ctx.accounts.team_a_usdc.key();
    duel.team_b_usdc      = ctx.accounts.team_b_usdc.key();
    duel.stake_amount     = stake_amount;
    duel.expire_ts        = expire_ts;
    duel.team_a_deposited = false;
    duel.team_b_deposited = false;
    duel.is_settled       = false;
    duel.winner           = 255;
    duel.bump             = ctx.bumps.duel_state;
    duel.vault_bump       = ctx.bumps.duel_vault;
    Ok(())
}

#[derive(Accounts)]
#[instruction(duel_id: String)]
pub struct InitializeDuel<'info> {
    #[account(mut)]
    pub layer: Signer<'info>,

    /// CHECK: wallet address only — stored as authority reference
    pub team_a: UncheckedAccount<'info>,
    /// CHECK: wallet address only — stored as authority reference
    pub team_b: UncheckedAccount<'info>,

    // Token accounts de destino fixados no momento do init — não podem ser trocados depois
    #[account(constraint = team_a_usdc.owner == team_a.key())]
    pub team_a_usdc: Account<'info, TokenAccount>,
    #[account(constraint = team_b_usdc.owner == team_b.key())]
    pub team_b_usdc: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = layer,
        space = 8 + DuelState::INIT_SPACE,
        seeds = [b"fantasy_duel", duel_id.as_bytes()],
        bump
    )]
    pub duel_state: Account<'info, DuelState>,

    #[account(
        init,
        payer = layer,
        token::mint      = usdc_mint,
        token::authority = duel_state,
        seeds = [b"duel_vault", duel_state.key().as_ref()],
        bump
    )]
    pub duel_vault: Account<'info, TokenAccount>,

    pub usdc_mint:      Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program:  Program<'info, Token>,
    pub rent:           Sysvar<'info, Rent>,
}
