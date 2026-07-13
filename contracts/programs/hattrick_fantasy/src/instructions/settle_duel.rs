use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Token, TokenAccount, Transfer};
use hattrick_provably_fair::state::SeedRecord;
use crate::errors::EscrowError;
use crate::state::DuelState;

pub fn handler(
    ctx: Context<SettleDuel>,
    duel_id: String,
    winner: u8,
) -> Result<()> {
    require!(!ctx.accounts.duel_state.is_settled, EscrowError::DuelAlreadySettled);
    require!(ctx.accounts.duel_state.team_a_deposited && ctx.accounts.duel_state.team_b_deposited, EscrowError::DepositsIncomplete);
    require!(winner <= 2, EscrowError::InvalidOutcome);
    // Bloqueia liquidação até o resultado estar on-chain via hattrick_provably_fair
    require!(ctx.accounts.seed_record.is_revealed, EscrowError::SimulationNotRevealed);

    ctx.accounts.duel_state.is_settled = true;
    ctx.accounts.duel_state.winner     = winner;

    let stake_amount = ctx.accounts.duel_state.stake_amount;
    let bump = ctx.accounts.duel_state.bump;
    let total = stake_amount.checked_mul(2).unwrap();
    let seeds: &[&[u8]] = &[b"fantasy_duel", duel_id.as_bytes(), &[bump]];
    let signer_seeds = &[seeds];

    match winner {
        2 => {
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
                stake_amount,
            )?;
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
                stake_amount,
            )?;
        }
        side => {
            let winner_usdc = if side == 0 {
                ctx.accounts.team_a_usdc.to_account_info()
            } else {
                ctx.accounts.team_b_usdc.to_account_info()
            };
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from:      ctx.accounts.duel_vault.to_account_info(),
                        to:        winner_usdc,
                        authority: ctx.accounts.duel_state.to_account_info(),
                    },
                    signer_seeds,
                ),
                total,
            )?;
        }
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
pub struct SettleDuel<'info> {
    #[account(
        mut,
        // Apenas a keypair do layer registrada no init pode liquidar
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

    // Destinos validados contra os endereços fixados no init — não podem ser substituídos
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

    /// SeedRecord do hattrick_provably_fair — deve ter is_revealed = true
    /// PDA: [b"seed_record", duel_id] owned by hattrick_provably_fair program
    #[account(
        seeds = [b"seed_record", duel_id.as_bytes()],
        bump  = seed_record.bump,
        seeds::program = hattrick_provably_fair::ID
    )]
    pub seed_record: Account<'info, SeedRecord>,

    pub token_program: Program<'info, Token>,
}
