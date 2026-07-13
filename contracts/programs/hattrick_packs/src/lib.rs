use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;
use state::CardTypeEntry;

declare_id!("BtgAtofxN8RJxaC824XUeamCZL13b63u2YaVTvhVGfFo");

#[program]
pub mod hattrick_packs {
    use super::*;

    pub fn initialize_category(
        ctx: Context<InitializeCategory>,
        template_id: String,
        category: String,
        cards_per_pack: u8,
        metadata_base_uri: String,
        card_types: Vec<CardTypeEntry>,
    ) -> Result<()> {
        instructions::initialize_category::handler(ctx, template_id, category, cards_per_pack, metadata_base_uri, card_types)
    }

    pub fn open_pack(
        ctx: Context<OpenPack>,
        template_id: String,
        pack_open_id: String,
        client_seed: [u8; 32],
    ) -> Result<()> {
        instructions::open_pack::handler(ctx, template_id, pack_open_id, client_seed)
    }

    pub fn fulfill_pack<'info>(
        ctx: Context<'_, '_, '_, 'info, FulfillPack<'info>>,
        template_id: String,
        pack_open_id: String,
    ) -> Result<()> {
        instructions::fulfill_pack::handler(ctx, template_id, pack_open_id)
    }

    pub fn restock_category(
        ctx: Context<RestockCategory>,
        template_id: String,
        category: String,
        entries: Vec<restock_category::RestockEntry>,
    ) -> Result<()> {
        instructions::restock_category::handler(ctx, template_id, category, entries)
    }

    pub fn close_category(
        ctx: Context<CloseCategory>,
        template_id: String,
        category: String,
    ) -> Result<()> {
        instructions::close_category::handler(ctx, template_id, category)
    }
}
