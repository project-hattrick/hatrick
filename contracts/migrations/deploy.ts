// Anchor deploy hook. Program deployment itself is handled by `anchor deploy`;
// add post-deploy bootstrap here (e.g. mint the play token) when wiring devnet.

import * as anchor from "@coral-xyz/anchor";

module.exports = async function (provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);
  // Post-deploy bootstrap goes here (faucet mint, config PDAs, ...).
};
