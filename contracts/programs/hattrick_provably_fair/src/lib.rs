use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("DsWff3P22AsnXAk7EthHNythzDWLc7bg5JS3aPpNjsLQ");

#[program]
pub mod hattrick_provably_fair {
    use super::*;

    /// Commit para duelos fantasy — valida layer contra DuelState.
    pub fn commit_seed(
        ctx: Context<CommitSeed>,
        record_id: String,
        server_seed_hash: [u8; 32],
    ) -> Result<()> {
        instructions::commit_seed::handler(ctx, record_id, server_seed_hash)
    }

    /// Commit para abertura de packs — sem cross-program check no DuelState.
    pub fn commit_seed_pack(
        ctx: Context<CommitSeedPack>,
        record_id: String,
        server_seed_hash: [u8; 32],
    ) -> Result<()> {
        instructions::commit_seed_pack::handler(ctx, record_id, server_seed_hash)
    }

    pub fn reveal_seed(
        ctx: Context<RevealSeed>,
        record_id: String,
        server_seed: [u8; 32],
        replay_json_hash: [u8; 32],
    ) -> Result<()> {
        instructions::reveal_seed::handler(ctx, record_id, server_seed, replay_json_hash)
    }

    pub fn close_record(ctx: Context<CloseRecord>, record_id: String) -> Result<()> {
        instructions::close_record::handler(ctx, record_id)
    }
}
