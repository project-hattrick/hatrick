//! `settle_market` — verify the oracle-signed result and lock in the winner.
//! Permissionless: anyone (the keeper) may submit, because the ed25519 signature
//! over the canonical message is the gate, not the caller.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{keccak, sysvar::instructions::ID as INSTRUCTIONS_ID};

use crate::constants::{MARKET_SEED, POOL_SEED};
use crate::error::HatTrickError;
use crate::state::{Market, MarketStatus, SelectionPool};
use crate::verify::{result_message, verify_ed25519, verify_merkle};

#[derive(Accounts)]
#[instruction(winning_selection: [u8; 32])]
pub struct SettleMarket<'info> {
    pub settler: Signer<'info>,

    #[account(
        mut,
        seeds = [MARKET_SEED, market.market_id.as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    /// Pool of the declared winning selection — its balance becomes `winning_pool`.
    #[account(
        seeds = [POOL_SEED, market.key().as_ref(), winning_selection.as_ref()],
        bump = winning_pool.bump,
        constraint = winning_pool.selection == winning_selection @ HatTrickError::WrongSelectionPool,
    )]
    pub winning_pool: Account<'info, SelectionPool>,

    /// CHECK: address-constrained to the Instructions sysvar; read-only.
    #[account(address = INSTRUCTIONS_ID)]
    pub instructions: UncheckedAccount<'info>,
}

pub fn handler(
    ctx: Context<SettleMarket>,
    winning_selection: [u8; 32],
    merkle_root: [u8; 32],
    merkle_proof: Vec<[u8; 32]>,
) -> Result<()> {
    let market = &ctx.accounts.market;
    require!(market.status == MarketStatus::Open, HatTrickError::MarketAlreadySettled);
    let now = Clock::get()?.unix_timestamp;
    require!(now >= market.close_ts, HatTrickError::SettleTooEarly);
    require!(merkle_proof.len() <= 32, HatTrickError::ProofTooLong);

    // 1) Oracle authenticity: the canonical message must be ed25519-signed by the
    //    market oracle (verified natively in the preceding instruction).
    let message = result_message(&market.market_id, &winning_selection, market.close_ts);
    verify_ed25519(
        &ctx.accounts.instructions.to_account_info(),
        &market.oracle,
        &message,
    )?;

    // 2) Provenance: the result leaf is in the TxLINE result tree (proof panel).
    let result_hash = keccak::hash(&message).0;
    verify_merkle(result_hash, &merkle_proof, merkle_root)?;

    let winning_pool_amount = ctx.accounts.winning_pool.amount;

    let market = &mut ctx.accounts.market;
    market.status = MarketStatus::Settled;
    market.winning_selection = winning_selection;
    market.winning_pool = winning_pool_amount;
    market.merkle_root = merkle_root;
    market.result_hash = result_hash;
    Ok(())
}
