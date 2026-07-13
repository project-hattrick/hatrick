use anchor_lang::prelude::*;

#[error_code]
pub enum ProvablyFairError {
    #[msg("Seed já foi revelada")]
    AlreadyRevealed,
    #[msg("Hash da seed revelada não confere com o commit")]
    SeedHashMismatch,
    #[msg("Apenas o layer pode revelar a seed")]
    Unauthorized,
    #[msg("SeedRecord ainda não foi revelado — não é possível fechar")]
    NotYetRevealed,
}
