use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Token, TokenAccount, Transfer};
use crate::errors::EscrowError;
use crate::state::DuelState;

pub fn handler(ctx: Context<CancelDuel>, duel_id: String) -> Result<()> {
    let duel = &ctx.accounts.duel_state;
    require!(!duel.is_settled, EscrowError::DuelAlreadySettled);
    require!(
        !(duel.team_a_deposited && duel.team_b_deposited),
        EscrowError::CannotCancelAfterDeposits
    );

    let seeds: &[&[u8]] = &[b"fantasy_duel", duel_id.as_bytes(), &[duel.bump]];
    let signer_seeds = &[seeds];

    if duel.team_a_deposited {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.duel_vault.to_account_info(),
                    to:        ctx.accounts.team_a_usdc.to_account_info(),
                    authority: ctx.accounts.duel_state.to_account_info(),
                },
                signer_seeds,
            ),
            duel.stake_amount,
        )?;
    }

    if duel.team_b_deposited {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.duel_vault.to_account_info(),
                    to:        ctx.accounts.team_b_usdc.to_account_info(),
                    authority: ctx.accounts.duel_state.to_account_info(),
                },
                signer_seeds,
            ),
            duel.stake_amount,
        )?;
    }

    token::close_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account:     ctx.accounts.duel_vault.to_account_info(),
            destination: ctx.accounts.layer.to_account_info(),
            authority:   ctx.accounts.duel_state.to_account_info(),
        },
        signer_seeds,
    ))?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(duel_id: String)]
pub struct CancelDuel<'info> {
    #[account(
        mut,
        constraint = layer.key() == duel_state.layer @ EscrowError::Unauthorized
    )]
    pub layer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"fantasy_duel", duel_id.as_bytes()],
        bump  = duel_state.bump,
        close = layer
    )]
    pub duel_state: Account<'info, DuelState>,

    #[account(
        mut,
        seeds = [b"duel_vault", duel_state.key().as_ref()],
        bump  = duel_state.vault_bump
    )]
    pub duel_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = team_a_usdc.key() == duel_state.team_a_usdc @ EscrowError::InvalidTokenAccount
    )]
    pub team_a_usdc: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = team_b_usdc.key() == duel_state.team_b_usdc @ EscrowError::InvalidTokenAccount
    )]
    pub team_b_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
