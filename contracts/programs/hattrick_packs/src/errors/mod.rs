use anchor_lang::prelude::*;

#[error_code]
pub enum PacksError {
    #[msg("Categoria já foi encerrada")]
    CategoryClosed,
    #[msg("Nenhuma carta disponível neste pool")]
    PoolExhausted,
    #[msg("Usuário não é dono deste pacote")]
    NotPackOwner,
    #[msg("Requisição VRF já está pendente para este pacote")]
    RequestAlreadyPending,
    #[msg("Requisição VRF não está pendente")]
    RequestNotPending,
    #[msg("Número aleatório do VRF resultou em índice inválido")]
    InvalidVrfResult,
    #[msg("Apenas a authority pode atualizar atributos")]
    Unauthorized,
    #[msg("O token account não pertence ao mint do pack informado")]
    InvalidPackMint,
    #[msg("A seed já foi revelada — commit deve acontecer antes da abertura")]
    SeedAlreadyRevealed,
    #[msg("A seed ainda não foi revelada — revele antes de fulfillment")]
    SeedNotRevealed,
    #[msg("cards_per_pack deve ser entre 1 e 50")]
    InvalidCardsPerPack,
    #[msg("remaining_accounts deve conter um asset account por carta do pack")]
    InsufficientAssetAccounts,
    #[msg("Vault não corresponde ao autorizado no open_pack")]
    UnauthorizedVault,
    #[msg("Supply overflow — quantidade excede u16::MAX")]
    SupplyOverflow,
    #[msg("Número máximo de card types por categoria atingido")]
    TooManyCardTypes,
    #[msg("template_id do vault não corresponde ao informado")]
    TemplateMismatch,
}
