//! Trustless settlement primitives.
//!
//! We do **not** CPI into a TxLINE program. Instead the keeper submits the
//! TxLINE-signed result alongside a native `Ed25519Program` instruction in the
//! same transaction; the runtime verifies the signature and we bind that
//! verified (pubkey, message) pair to the market's oracle here. The Merkle proof
//! is checked against the result root for the on-chain "view proof" panel.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    ed25519_program, keccak,
    sysvar::instructions::{load_current_index_checked, load_instruction_at_checked},
};

use crate::error::HatTrickError;

/// Canonical bytes the oracle signs for a settlement:
/// `market_id(16) || winning_selection(32) || close_ts(8 LE)`.
pub fn result_message(market_id: &[u8; 16], winning_selection: &[u8; 32], close_ts: i64) -> Vec<u8> {
    let mut msg = Vec::with_capacity(16 + 32 + 8);
    msg.extend_from_slice(market_id);
    msg.extend_from_slice(winning_selection);
    msg.extend_from_slice(&close_ts.to_le_bytes());
    msg
}

/// Assert the transaction carries a native ed25519 verification (immediately
/// before this instruction) for `expected_pubkey` over `expected_message`.
/// The runtime already proved the signature is valid; we only bind it.
pub fn verify_ed25519(
    ix_sysvar: &AccountInfo,
    expected_pubkey: &Pubkey,
    expected_message: &[u8],
) -> Result<()> {
    let current = load_current_index_checked(ix_sysvar)? as usize;
    require!(current > 0, HatTrickError::InvalidOracleSignature);

    let ed_ix = load_instruction_at_checked(current - 1, ix_sysvar)
        .map_err(|_| HatTrickError::InvalidOracleSignature)?;
    require_keys_eq!(
        ed_ix.program_id,
        ed25519_program::ID,
        HatTrickError::InvalidOracleSignature
    );

    // Layout: num_sigs(1) | padding(1) | offsets(7 * u16) | ... | pubkey | sig | msg
    let data = &ed_ix.data;
    require!(data.len() >= 16, HatTrickError::InvalidOracleSignature);
    require!(data[0] == 1, HatTrickError::InvalidOracleSignature);

    let read_u16 = |o: usize| u16::from_le_bytes([data[o], data[o + 1]]) as usize;

    // The three *_instruction_index fields tell the native verifier which
    // instruction holds the pubkey/message/signature it actually checks. Unless
    // they all reference THIS instruction (sentinel 0xFFFF), an attacker could
    // point them at another instruction (self-signed with their own key) while
    // planting the oracle pubkey + expected message at the offsets we read here,
    // bypassing the oracle gate. Require the sentinel so the bytes we parse are
    // exactly the bytes the runtime verified.
    const SELF_IX: usize = 0xFFFF;
    require!(read_u16(4) == SELF_IX, HatTrickError::InvalidOracleSignature); // signature
    require!(read_u16(8) == SELF_IX, HatTrickError::InvalidOracleSignature); // public key
    require!(read_u16(14) == SELF_IX, HatTrickError::InvalidOracleSignature); // message

    let pubkey_off = read_u16(6);
    let msg_off = read_u16(10);
    let msg_size = read_u16(12);

    require!(
        data.len() >= pubkey_off + 32 && data.len() >= msg_off + msg_size,
        HatTrickError::InvalidOracleSignature
    );

    let signed_pubkey = &data[pubkey_off..pubkey_off + 32];
    let signed_msg = &data[msg_off..msg_off + msg_size];

    require!(
        signed_pubkey == expected_pubkey.as_ref(),
        HatTrickError::InvalidOracleSignature
    );
    require!(
        signed_msg == expected_message,
        HatTrickError::InvalidOracleSignature
    );
    Ok(())
}

/// Verify a sorted-pair keccak Merkle proof. Empty proof ⇒ leaf must equal root.
pub fn verify_merkle(leaf: [u8; 32], proof: &[[u8; 32]], root: [u8; 32]) -> Result<()> {
    let mut computed = leaf;
    for sibling in proof {
        computed = if computed <= *sibling {
            keccak::hashv(&[&computed, sibling]).0
        } else {
            keccak::hashv(&[sibling, &computed]).0
        };
    }
    require!(computed == root, HatTrickError::InvalidMerkleProof);
    Ok(())
}
