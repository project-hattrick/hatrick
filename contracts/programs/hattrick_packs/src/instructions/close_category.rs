use anchor_lang::prelude::*;
use crate::errors::PacksError;
use crate::state::CategoryVault;

pub fn handler(ctx: Context<CloseCategory>, _template_id: String, _category: String) -> Result<()> {
    ctx.accounts.category_vault.is_closed = true;
    Ok(())
}

#[derive(Accounts)]
#[instruction(template_id: String, category: String)]
pub struct CloseCategory<'info> {
    #[account(
        mut,
        constraint = authority.key() == category_vault.authority @ PacksError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds  = [b"category_vault", template_id.as_bytes(), category.as_bytes()],
        bump   = category_vault.bump,
        close  = authority
    )]
    pub category_vault: Account<'info, CategoryVault>,
}
