use anchor_lang::prelude::*;

/// PDA temporária criada quando o usuário abre um pack.
/// Armazena quais vaults participam do sorteio — definido no open_pack e validado no fulfill_pack.
#[account]
#[derive(InitSpace)]
pub struct PackRequest {
    pub user:         Pubkey,
    pub pack_mint:    Pubkey,
    /// Seed do cliente — desconhecida do layer quando ele commitou o server_seed
    pub client_seed:  [u8; 32],
    /// Liga ao SeedRecord do hattrick_provably_fair
    #[max_len(36)]
    pub pack_open_id: String,
    /// UUID do template — necessário para derivar seeds dos vaults no fulfill_pack
    #[max_len(36)]
    pub template_id:  String,
    /// Vaults autorizados para este pack (até 3: common, rare, legendary)
    /// Pubkey::default() significa "não usado"
    pub vault_0:      Pubkey,  // sempre presente (common)
    pub vault_1:      Pubkey,  // rare (ou default se standard)
    pub vault_2:      Pubkey,  // legendary (ou default se não legendary)
    pub vault_count:  u8,      // 1 = standard | 2 = premium | 3 = legendary
    pub is_pending:   bool,
    pub bump:         u8,
}
