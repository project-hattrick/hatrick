use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount};
use hattrick_provably_fair::state::SeedRecord;
use crate::errors::PacksError;
use crate::state::{PackRequest, CategoryVault};

pub fn handler(
    ctx: Context<OpenPack>,
    template_id: String,
    pack_open_id: String,
    client_seed: [u8; 32],
) -> Result<()> {
    let v0 = &ctx.accounts.vault_0;
    require!(!v0.is_closed, PacksError::CategoryClosed);
    require!(v0.template_id == template_id, PacksError::TemplateMismatch);

    let mut vault_count: u8 = 1;
    let mut total_remaining: u32 = v0.card_types.iter().map(|c| c.remaining as u32).sum();

    if let Some(v1) = &ctx.accounts.vault_1 {
        require!(!v1.is_closed, PacksError::CategoryClosed);
        require!(v1.template_id == template_id, PacksError::TemplateMismatch);
        total_remaining += v1.card_types.iter().map(|c| c.remaining as u32).sum::<u32>();
        vault_count += 1;
    }
    if let Some(v2) = &ctx.accounts.vault_2 {
        require!(!v2.is_closed, PacksError::CategoryClosed);
        require!(v2.template_id == template_id, PacksError::TemplateMismatch);
        total_remaining += v2.card_types.iter().map(|c| c.remaining as u32).sum::<u32>();
        vault_count += 1;
    }

    require!(total_remaining > 0, PacksError::PoolExhausted);

    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint:      ctx.accounts.pack_mint.to_account_info(),
                from:      ctx.accounts.user_pack_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        1,
    )?;

    let request = &mut ctx.accounts.pack_request;
    request.user         = ctx.accounts.user.key();
    request.pack_mint    = ctx.accounts.pack_mint.key();
    request.client_seed  = client_seed;
    request.pack_open_id = pack_open_id;
    request.template_id  = template_id;
    request.vault_0      = ctx.accounts.vault_0.key();
    request.vault_1      = ctx.accounts.vault_1.as_ref().map(|v| v.key()).unwrap_or_default();
    request.vault_2      = ctx.accounts.vault_2.as_ref().map(|v| v.key()).unwrap_or_default();
    request.vault_count  = vault_count;
    request.is_pending   = true;
    request.bump         = ctx.bumps.pack_request;

    Ok(())
}

#[derive(Accounts)]
#[instruction(template_id: String, pack_open_id: String)]
pub struct OpenPack<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"category_vault", template_id.as_bytes(), vault_0.category.as_bytes()],
        bump  = vault_0.bump
    )]
    pub vault_0: Account<'info, CategoryVault>,

    #[account(
        mut,
        seeds = [b"category_vault", template_id.as_bytes(), vault_1.category.as_bytes()],
        bump  = vault_1.bump
    )]
    pub vault_1: Option<Account<'info, CategoryVault>>,

    #[account(
        mut,
        seeds = [b"category_vault", template_id.as_bytes(), vault_2.category.as_bytes()],
        bump  = vault_2.bump
    )]
    pub vault_2: Option<Account<'info, CategoryVault>>,

    #[account(mut)]
    pub pack_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = user_pack_account.owner == user.key()      @ PacksError::NotPackOwner,
        constraint = user_pack_account.mint  == pack_mint.key() @ PacksError::InvalidPackMint,
    )]
    pub user_pack_account: Account<'info, TokenAccount>,

    #[account(
        seeds  = [b"seed_record", pack_open_id.as_bytes()],
        bump   = seed_record.bump,
        seeds::program = hattrick_provably_fair::ID,
        constraint = !seed_record.is_revealed @ PacksError::SeedAlreadyRevealed,
    )]
    pub seed_record: Account<'info, SeedRecord>,

    #[account(
        init,
        payer = user,
        space = 8 + PackRequest::INIT_SPACE,
        seeds = [b"pack_request", user.key().as_ref(), pack_mint.key().as_ref()],
        bump
    )]
    pub pack_request: Account<'info, PackRequest>,

    pub system_program: Program<'info, System>,
    pub token_program:  Program<'info, Token>,
}
