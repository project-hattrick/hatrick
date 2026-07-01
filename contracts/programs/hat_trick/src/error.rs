//! Program error codes. Stable order — clients map by name, not index.

use anchor_lang::prelude::*;

#[error_code]
pub enum HatTrickError {
    #[msg("Stake amount must be greater than zero")]
    ZeroAmount,
    #[msg("Betting window for this market is closed")]
    BettingClosed,
    #[msg("Market is not open")]
    MarketNotOpen,
    #[msg("Market has already been settled")]
    MarketAlreadySettled,
    #[msg("Market has not been settled yet")]
    MarketNotSettled,
    #[msg("Cannot settle before the market close time")]
    SettleTooEarly,
    #[msg("Oracle (TxLINE) signature is missing or invalid")]
    InvalidOracleSignature,
    #[msg("Merkle proof does not match the result root")]
    InvalidMerkleProof,
    #[msg("This position did not back the winning selection")]
    NotWinner,
    #[msg("Payout has already been claimed for this position")]
    AlreadyClaimed,
    #[msg("Winning selection has an empty pool — nothing to pay out")]
    EmptyWinningPool,
    #[msg("Selection pool does not match the settled winning selection")]
    WrongSelectionPool,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Merkle proof is longer than the supported maximum")]
    ProofTooLong,
    #[msg("Cannot void before close_ts + void_delay")]
    VoidTooEarly,
    #[msg("Market has not been voided")]
    MarketNotVoided,
}
