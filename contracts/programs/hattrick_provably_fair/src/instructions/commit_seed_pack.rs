use anchor_lang::prelude::*;
use crate::errors::ProvablyFairError;
use crate::state::SeedRecord;

/// Commit de seed para abertura de pack. Não exige DuelState —
/// a autoridade do layer é validada no fulfill_pack contra CategoryVault.authority.
pub fn handler(
    ctx: Context<CommitSeedPack>,
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
pub struct CommitSeedPack<'info> {
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

// Intencionalmente sem cross-program check: a autoridade do layer sobre o vault é
// validada no fulfill_pack (constraint layer.key() == vault_0.authority).
// Isso evita dependência circular provably_fair → hattrick_packs.
