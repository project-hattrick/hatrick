use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hashv;
use mpl_core::instructions::CreateV1CpiBuilder;
use hattrick_provably_fair::state::SeedRecord;
use crate::errors::PacksError;
use crate::state::{PackRequest, CategoryVault};

pub fn handler<'info>(ctx: Context<'_, '_, '_, 'info, FulfillPack<'info>>, template_id: String, pack_open_id: String) -> Result<()> {
    let request  = &ctx.accounts.pack_request;
    let seed_rec = &ctx.accounts.seed_record;
    let user_key = request.user;

    require!(request.is_pending, PacksError::RequestNotPending);
    require!(request.template_id == template_id, PacksError::TemplateMismatch);

    require!(ctx.accounts.vault_0.key() == request.vault_0, PacksError::UnauthorizedVault);
    if request.vault_count >= 2 {
        require!(
            ctx.accounts.vault_1.as_ref().map(|v| v.key()) == Some(request.vault_1),
            PacksError::UnauthorizedVault
        );
    }
    if request.vault_count >= 3 {
        require!(
            ctx.accounts.vault_2.as_ref().map(|v| v.key()) == Some(request.vault_2),
            PacksError::UnauthorizedVault
        );
    }

    let cards_to_mint = ctx.accounts.vault_0.cards_per_pack as usize;
    let base_uri      = ctx.accounts.vault_0.metadata_base_uri.clone();

    require!(
        ctx.remaining_accounts.len() >= cards_to_mint,
        PacksError::InsufficientAssetAccounts
    );

    for i in 0..cards_to_mint {
        let remaining_0: u32 = ctx.accounts.vault_0.card_types.iter().map(|c| c.remaining as u32).sum();
        let remaining_1: u32 = ctx.accounts.vault_1.as_ref()
            .map(|v| v.card_types.iter().map(|c| c.remaining as u32).sum())
            .unwrap_or(0);
        let remaining_2: u32 = ctx.accounts.vault_2.as_ref()
            .map(|v| v.card_types.iter().map(|c| c.remaining as u32).sum())
            .unwrap_or(0);
        let total_remaining = remaining_0 + remaining_1 + remaining_2;

        if total_remaining == 0 { break; }

        let combined   = hashv(&[&seed_rec.server_seed, &request.client_seed, &[i as u8]]);
        let random_u32 = u32::from_le_bytes(combined.to_bytes()[0..4].try_into().unwrap());
        let pick       = random_u32 % total_remaining;

        let chosen_id = if pick < remaining_0 {
            pick_from_vault(&mut ctx.accounts.vault_0.card_types, pick)?
        } else if pick < remaining_0 + remaining_1 {
            pick_from_vault(ctx.accounts.vault_1.as_mut().unwrap().card_types.as_mut(), pick - remaining_0)?
        } else {
            pick_from_vault(ctx.accounts.vault_2.as_mut().unwrap().card_types.as_mut(), pick - remaining_0 - remaining_1)?
        };

        let asset_info = &ctx.remaining_accounts[i];
        let name = format!("Player {} #{}", chosen_id, &pack_open_id[..8]);
        let uri  = format!("{}{}", base_uri, chosen_id);

        CreateV1CpiBuilder::new(&ctx.accounts.mpl_core_program)
            .asset(asset_info)
            .payer(&ctx.accounts.layer.to_account_info())
            .owner(Some(&ctx.accounts.user.to_account_info()))
            .system_program(&ctx.accounts.system_program.to_account_info())
            .name(name)
            .uri(uri)
            .invoke()?;

        msg!("Card {}/{}: player_id={} → {}", i + 1, cards_to_mint, chosen_id, user_key);
    }

    ctx.accounts.pack_request.is_pending = false;
    msg!("Pack {} fulfilled for {}", pack_open_id, user_key);
    Ok(())
}

fn pick_from_vault(
    card_types: &mut Vec<crate::state::CardTypeEntry>,
    pick: u32,
) -> Result<u32> {
    let mut cumulative: u32 = 0;
    for card in card_types.iter_mut() {
        cumulative += card.remaining as u32;
        if pick < cumulative {
            require!(card.remaining > 0, PacksError::InvalidVrfResult);
            card.remaining -= 1;
            return Ok(card.real_player_id);
        }
    }
    Err(PacksError::InvalidVrfResult.into())
}

#[derive(Accounts)]
#[instruction(template_id: String, pack_open_id: String)]
pub struct FulfillPack<'info> {
    #[account(
        mut,
        constraint = layer.key() == vault_0.authority @ PacksError::Unauthorized
    )]
    pub layer: Signer<'info>,

    /// CHECK: apenas recebe NFTs
    #[account(constraint = user.key() == pack_request.user @ PacksError::NotPackOwner)]
    pub user: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"pack_request", pack_request.user.as_ref(), pack_request.pack_mint.as_ref()],
        bump  = pack_request.bump,
        close = layer
    )]
    pub pack_request: Account<'info, PackRequest>,

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

    #[account(
        seeds  = [b"seed_record", pack_open_id.as_bytes()],
        bump   = seed_record.bump,
        seeds::program = hattrick_provably_fair::ID,
        constraint = seed_record.is_revealed @ PacksError::SeedNotRevealed,
    )]
    pub seed_record: Account<'info, SeedRecord>,

    /// CHECK: verificado pelo Metaplex Core program
    pub mpl_core_program: UncheckedAccount<'info>,
    pub system_program:   Program<'info, System>,
    // remaining_accounts: [AssetAccount; cards_per_pack] — keypairs gerados pelo cliente, um por carta
}
