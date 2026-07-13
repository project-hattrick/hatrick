use anchor_lang::prelude::*;
use crate::errors::ProvablyFairError;
use crate::state::SeedRecord;

pub fn handler(_ctx: Context<CloseRecord>, _record_id: String) -> Result<()> {
    // Anchor fecha a conta e devolve rent ao layer via `close = layer`
    Ok(())
}

#[derive(Accounts)]
#[instruction(record_id: String)]
pub struct CloseRecord<'info> {
    #[account(
        mut,
        constraint = layer.key() == seed_record.layer @ ProvablyFairError::Unauthorized
    )]
    pub layer: Signer<'info>,

    #[account(
        mut,
        seeds  = [b"seed_record", record_id.as_bytes()],
        bump   = seed_record.bump,
        constraint = seed_record.is_revealed @ ProvablyFairError::NotYetRevealed,
        close  = layer
    )]
    pub seed_record: Account<'info, SeedRecord>,
}
