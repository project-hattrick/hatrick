use anchor_lang::prelude::*;
use crate::errors::PacksError;
use crate::state::CategoryVault;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RestockEntry {
    pub real_player_id: u32,
    pub add_supply:     u16,
}

pub fn handler(
    ctx: Context<RestockCategory>,
    template_id: String,
    _category: String,
    entries: Vec<RestockEntry>,
) -> Result<()> {
    let vault = &mut ctx.accounts.category_vault;
    require!(!vault.is_closed, PacksError::CategoryClosed);
    require!(vault.template_id == template_id, PacksError::TemplateMismatch);

    for entry in entries.iter() {
        let card = vault.card_types
            .iter_mut()
            .find(|c| c.real_player_id == entry.real_player_id);

        match card {
            Some(c) => {
                c.remaining      = c.remaining.checked_add(entry.add_supply)
                    .ok_or(PacksError::SupplyOverflow)?;
                c.initial_supply = c.initial_supply.checked_add(entry.add_supply)
                    .ok_or(PacksError::SupplyOverflow)?;
            }
            None => {
                require!(
                    vault.card_types.len() < crate::state::MAX_CARD_TYPES,
                    PacksError::TooManyCardTypes
                );
                vault.card_types.push(crate::state::CardTypeEntry {
                    real_player_id: entry.real_player_id,
                    initial_supply: entry.add_supply,
                    remaining:      entry.add_supply,
                });
            }
        }
    }

    Ok(())
}

#[derive(Accounts)]
#[instruction(template_id: String, category: String)]
pub struct RestockCategory<'info> {
    #[account(
        mut,
        constraint = authority.key() == category_vault.authority @ PacksError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"category_vault", template_id.as_bytes(), category.as_bytes()],
        bump  = category_vault.bump
    )]
    pub category_vault: Account<'info, CategoryVault>,
}
