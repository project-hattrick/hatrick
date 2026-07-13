use anchor_lang::prelude::*;

pub const MAX_CARD_TYPES: usize = 200;

/// Cofre de uma categoria de pack (ex: "legendary", "common", "rare") por template.
/// Cada PackTemplate tem seus próprios vaults — seeds incluem template_id + category.
#[account]
#[derive(InitSpace)]
pub struct CategoryVault {
    #[max_len(36)]
    pub template_id:       String,  // UUID do PackTemplate no banco
    #[max_len(32)]
    pub category:          String,  // "common" | "rare" | "legendary"
    pub is_closed:         bool,
    pub authority:         Pubkey,  // hattrick-layer keypair
    pub cards_per_pack:    u8,
    #[max_len(100)]
    pub metadata_base_uri: String,  // "https://metadata.hattrick.app/cards/"
    pub bump:              u8,
    #[max_len(MAX_CARD_TYPES)]
    pub card_types:        Vec<CardTypeEntry>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct CardTypeEntry {
    pub real_player_id: u32,    // ID numérico do jogador (ex: 1251512525)
    pub initial_supply: u16,
    pub remaining:      u16,
}
