use anchor_lang::prelude::*;
use crate::errors::PacksError;
use crate::state::{CardTypeEntry, CategoryVault};

pub fn handler(
    ctx: Context<InitializeCategory>,
    template_id: String,
    category: String,
    cards_per_pack: u8,
    metadata_base_uri: String,
    card_types: Vec<CardTypeEntry>,
) -> Result<()> {
    require!(cards_per_pack > 0 && cards_per_pack <= 50, PacksError::InvalidCardsPerPack);

    let vault = &mut ctx.accounts.category_vault;
    vault.template_id       = template_id;
    vault.category          = category;
    vault.is_closed         = false;
    vault.authority         = ctx.accounts.authority.key();
    vault.cards_per_pack    = cards_per_pack;
    vault.metadata_base_uri = metadata_base_uri;
    vault.bump              = ctx.bumps.category_vault;
    vault.card_types        = card_types;
    Ok(())
}

#[derive(Accounts)]
#[instruction(template_id: String, category: String)]
pub struct InitializeCategory<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + CategoryVault::INIT_SPACE,
        seeds = [b"category_vault", template_id.as_bytes(), category.as_bytes()],
        bump
    )]
    pub category_vault: Account<'info, CategoryVault>,

    pub system_program: Program<'info, System>,
}
