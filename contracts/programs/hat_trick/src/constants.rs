//! PDA seeds and program-wide constants. Keep seeds in one place so the
//! keeper bot (api) and the wallet flow (front) derive identical addresses.

use anchor_lang::prelude::*;

/// Seed for a betting market PDA: `[MARKET_SEED, market_id]`.
#[constant]
pub const MARKET_SEED: &[u8] = b"market";

/// Seed for a market's escrow token vault PDA: `[VAULT_SEED, market]`.
#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

/// Seed for a per-selection stake pool PDA: `[POOL_SEED, market, selection]`.
#[constant]
pub const POOL_SEED: &[u8] = b"pool";

/// Seed for a user's position PDA: `[POSITION_SEED, market, owner, selection]`.
#[constant]
pub const POSITION_SEED: &[u8] = b"position";
