import * as anchor from '@coral-xyz/anchor';
import { assert } from 'chai';

describe('hattrick_fantasy', () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  it('initializes a duel', async () => {
    // TODO: initialize_duel, assert duel_state created
    assert.ok(true, 'placeholder');
  });

  it('both players deposit stake', async () => {
    // TODO: deposit_stake x2, assert vault balance = stake * 2
    assert.ok(true, 'placeholder');
  });

  it('settles duel and pays winner', async () => {
    // TODO: settle_duel winner=0, assert teamA receives full pot
    assert.ok(true, 'placeholder');
  });

  it('settles a draw and refunds both players', async () => {
    // TODO: settle_duel winner=2, assert each player gets stake back
    assert.ok(true, 'placeholder');
  });

  it('cancels duel before both deposits', async () => {
    // TODO: cancel_duel after teamA deposits, assert teamA refunded
    assert.ok(true, 'placeholder');
  });
});
