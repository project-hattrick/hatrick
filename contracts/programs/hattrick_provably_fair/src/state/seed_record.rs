use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct SeedRecord {
    /// ID genérico do contexto (duel_id para duelos, pack_open_id para packs)
    #[max_len(36)]
    pub record_id:        String,
    pub server_seed_hash: [u8; 32],   // SHA-256 do server_seed, commitado antes do jogo
    pub server_seed:      [u8; 32],   // seed revelada após o jogo; zero até reveal
    pub replay_json_hash: [u8; 32],   // SHA-256 do replay JSON, definido no reveal
    pub is_revealed:      bool,
    pub layer:            Pubkey,     // authority que pode chamar reveal
    pub bump:             u8,
}
