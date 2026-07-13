import * as anchor from '@coral-xyz/anchor';

module.exports = async function (provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);
  // Deploy order matters: packs and betting are independent,
  // fantasy_escrow and provably_fair are called by hattrick-layer.
  console.log('Deploy via: anchor deploy --provider.cluster devnet');
  console.log('After deploy, update program IDs in:');
  console.log('  - Anchor.toml');
  console.log('  - apps/txline-service/.env  (HATTRICK_BETTING_PROGRAM_ID)');
  console.log('  - apps/hattrick-layer/.env  (HATTRICK_PACKS_PROGRAM_ID, etc.)');
};
