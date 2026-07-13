use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("Duelo já foi liquidado")]
    DuelAlreadySettled,
    #[msg("Depósito já foi feito por este participante")]
    AlreadyDeposited,
    #[msg("Ambos os depósitos são necessários antes de liquidar")]
    DepositsIncomplete,
    #[msg("Caller não é participante deste duelo")]
    NotAParticipant,
    #[msg("Simulação ainda não foi concluída")]
    SimulationPending,
    #[msg("Outcome inválido — use 0 (teamA), 1 (teamB) ou 2 (draw)")]
    InvalidOutcome,
    #[msg("Duelo não pode ser cancelado após depósitos completos")]
    CannotCancelAfterDeposits,
    #[msg("Apenas o layer registrado no init pode executar esta instrução")]
    Unauthorized,
    #[msg("Token account não corresponde ao endereço registrado no init do duelo")]
    InvalidTokenAccount,
    #[msg("Duelo ainda não expirou")]
    DuelNotExpired,
    #[msg("Resultado do jogo ainda não foi revelado no contrato de provably fair")]
    SimulationNotRevealed,
}
