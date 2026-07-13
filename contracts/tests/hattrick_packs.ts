import * as anchor from '@coral-xyz/anchor';
import { assert } from 'chai';

describe('hattrick_packs', () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  it('initializes a category vault', async () => {
    // TODO: initialize_category with card_types, assert category_vault created
    assert.ok(true, 'placeholder');
  });

  it('burns pack SFT and creates pack_request', async () => {
    // TODO: open_pack with client_seed, assert pack_mint supply reduced, pack_request created
    assert.ok(true, 'placeholder');
  });

  it('fulfills pack and mints 5 Metaplex Core NFTs', async () => {
    // TODO: fulfill_pack with revealed seed, assert 5 NFTs minted, card_type.remaining -= 5
    assert.ok(true, 'placeholder');
  });

  it('restocks a category supply', async () => {
    // TODO: restock_category, assert remaining increased for specified card_types
    assert.ok(true, 'placeholder');
  });

  it('updates card attributes after a goal event', async () => {
    // TODO: update_attributes, assert Metaplex Core metadata updated
    assert.ok(true, 'placeholder');
  });

  it('closes a category vault', async () => {
    // TODO: close_category, assert account closed and rent returned
    assert.ok(true, 'placeholder');
  });
});
