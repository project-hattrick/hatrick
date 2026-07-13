use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash;
use crate::errors::ProvablyFairError;
use crate::state::SeedRecord;

pub fn handler(
    ctx: Context<RevealSeed>,
    _record_id: String,
    server_seed: [u8; 32],
    replay_json_hash: [u8; 32],
) -> Result<()> {
    let record = &mut ctx.accounts.seed_record;

    require!(!record.is_revealed, ProvablyFairError::AlreadyRevealed);

    let computed_hash = hash::hashv(&[&server_seed]).to_bytes();
    require!(
        computed_hash == record.server_seed_hash,
        ProvablyFairError::SeedHashMismatch
    );

    record.server_seed      = server_seed;
    record.replay_json_hash = replay_json_hash;
    record.is_revealed      = true;

    Ok(())
}

#[derive(Accounts)]
#[instruction(record_id: String)]
pub struct RevealSeed<'info> {
    #[account(
        mut,
        constraint = layer.key() == seed_record.layer @ ProvablyFairError::Unauthorized
    )]
    pub layer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"seed_record", record_id.as_bytes()],
        bump  = seed_record.bump
    )]
    pub seed_record: Account<'info, SeedRecord>,
}
