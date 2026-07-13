use anchor_lang::prelude::*;
use crate::state::SeedRecord;

/// Commit de seed para um duelo fantasy. Layer é signer — autoridade validada off-chain.
pub fn handler(
    ctx: Context<CommitSeed>,
    record_id: String,
    server_seed_hash: [u8; 32],
) -> Result<()> {
    let record = &mut ctx.accounts.seed_record;
    record.record_id        = record_id;
    record.server_seed_hash = server_seed_hash;
    record.server_seed      = [0u8; 32];
    record.replay_json_hash = [0u8; 32];
    record.is_revealed      = false;
    record.layer            = ctx.accounts.layer.key();
    record.bump             = ctx.bumps.seed_record;
    Ok(())
}

#[derive(Accounts)]
#[instruction(record_id: String)]
pub struct CommitSeed<'info> {
    #[account(mut)]
    pub layer: Signer<'info>,

    #[account(
        init,
        payer = layer,
        space = 8 + SeedRecord::INIT_SPACE,
        seeds = [b"seed_record", record_id.as_bytes()],
        bump
    )]
    pub seed_record: Account<'info, SeedRecord>,

    pub system_program: Program<'info, System>,
}
