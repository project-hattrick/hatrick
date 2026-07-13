use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::errors::EscrowError;
use crate::state::DuelState;

pub fn handler(ctx: Context<DepositStake>, duel_id: String) -> Result<()> {
    let duel = &mut ctx.accounts.duel_state;
    require!(!duel.is_settled, EscrowError::DuelAlreadySettled);

    let depositor = ctx.accounts.depositor.key();
    let is_team_a = depositor == duel.team_a;
    let is_team_b = depositor == duel.team_b;

    require!(is_team_a || is_team_b, EscrowError::NotAParticipant);

    // Garante que o depósito sai do account pré-registrado no init — não de outro qualquer
    if is_team_a {
        require!(
            ctx.accounts.depositor_usdc.key() == duel.team_a_usdc,
            EscrowError::InvalidTokenAccount
        );
        require!(!duel.team_a_deposited, EscrowError::AlreadyDeposited);
        duel.team_a_deposited = true;
    } else {
        require!(
            ctx.accounts.depositor_usdc.key() == duel.team_b_usdc,
            EscrowError::InvalidTokenAccount
        );
        require!(!duel.team_b_deposited, EscrowError::AlreadyDeposited);
        duel.team_b_deposited = true;
    }

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from:      ctx.accounts.depositor_usdc.to_account_info(),
                to:        ctx.accounts.duel_vault.to_account_info(),
                authority: ctx.accounts.depositor.to_account_info(),
            },
        ),
        duel.stake_amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(duel_id: String)]
pub struct DepositStake<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        mut,
        seeds = [b"fantasy_duel", duel_id.as_bytes()],
        bump  = duel_state.bump
    )]
    pub duel_state: Account<'info, DuelState>,

    #[account(
        mut,
        seeds = [b"duel_vault", duel_state.key().as_ref()],
        bump  = duel_state.vault_bump
    )]
    pub duel_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub depositor_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
