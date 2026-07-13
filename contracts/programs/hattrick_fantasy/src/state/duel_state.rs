use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct DuelState {
    #[max_len(36)]
    pub duel_id:          String,   // UUID v4 (36 chars)
    pub layer:            Pubkey,   // hattrick-layer keypair — única autoridade para settle/cancel
    pub team_a:           Pubkey,
    pub team_b:           Pubkey,
    pub team_a_usdc:      Pubkey,   // token account de destino do teamA — fixado no init
    pub team_b_usdc:      Pubkey,   // token account de destino do teamB — fixado no init
    pub stake_amount:     u64,      // per player; vault holds stake_amount * 2
    pub expire_ts:        i64,      // unix ts após o qual qualquer um pode forçar reembolso
    pub team_a_deposited: bool,
    pub team_b_deposited: bool,
    pub is_settled:       bool,
    pub winner:           u8,       // 0 = teamA, 1 = teamB, 2 = draw, 255 = not set
    pub bump:             u8,
    pub vault_bump:       u8,
}
