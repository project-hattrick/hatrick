use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum MarketStatus {
    Open,
    Settled,
    Voided,
}

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub authority:         Pubkey,
    /// Ed25519 signer whose signature settles this market
    /// TxLINE oracle keypair — the only key that can settle this market.
    pub oracle:    Pubkey,
    pub mint:      Pubkey,
    /// Opaque 16-byte id: e.g. keccak(fixture_id || market_type)[:16]
    pub market_id: [u8; 16],
    pub status:    MarketStatus,
    pub total_pool:        u64,
    pub winning_pool:      u64,
    pub winning_selection: [u8; 32],
    pub merkle_root:       [u8; 32],
    pub result_hash:       [u8; 32],
    pub close_ts:          i64,
    pub void_delay:        i64,
    pub vault_bump:        u8,
    pub bump:              u8,
}

/// Running total staked on one selection within a market.
#[account]
#[derive(InitSpace)]
pub struct SelectionPool {
    pub market:    Pubkey,
    pub selection: [u8; 32],
    pub amount:    u64,
    pub bump:      u8,
}

/// One bettor's stake on one selection.
#[account]
#[derive(InitSpace)]
pub struct Position {
    pub market:    Pubkey,
    pub owner:     Pubkey,
    pub selection: [u8; 32],
    pub amount:    u64,
    pub odds_bps:  u32,
    pub claimed:   bool,
    pub bump:      u8,
}
