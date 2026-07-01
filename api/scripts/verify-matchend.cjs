/**
 * Verifies B2: the COMPILED normalizer emits `match-end.after` (once) with a
 * parsed 1X2 outcome at confirmed full time. No validator needed.
 *
 *   npm run build && node scripts/verify-matchend.cjs
 */
const { TxlineNormalizerService } = require('../dist/txline/txline-normalizer.service');
const { EventName } = require('../dist/events/enums/event-name.enum');

const assert = (c, m) => { if (!c) throw new Error('ASSERT FAILED: ' + m); };

const emitted = [];
const emitter = { emit: (name, payload) => emitted.push({ name, payload }) };
const state = { applyScore() {}, applyOdds() {} };
const norm = new TxlineNormalizerService(emitter, state);

const ft = (extra) => ({ fixtureId: 7, seq: 9, ts: 1000, confirmed: true, gameState: 'FullTime', scoreSoccer: { Participant1: 2, Participant2: 1 }, ...extra });

// during (unconfirmed) full-time must NOT settle
norm.handleScore(ft({ confirmed: false }));
assert(!emitted.some((e) => e.name === EventName.MatchEndAfter), 'no match-end on DURING');
console.log('✓ no match-end.after on unconfirmed event');

// confirmed full time → one match-end with outcome Home (2-1)
norm.handleScore(ft());
const ends = emitted.filter((e) => e.name === EventName.MatchEndAfter);
assert(ends.length === 1, `expected 1 match-end, got ${ends.length}`);
assert(ends[0].payload.fixtureId === 7, 'fixtureId');
assert(ends[0].payload.outcome === 'Home', `outcome should be Home, got ${ends[0].payload.outcome}`);
console.log('✓ match-end.after emitted with outcome Home (2-1)');

// duplicate confirmed full time → no second emit
norm.handleScore(ft());
assert(emitted.filter((e) => e.name === EventName.MatchEndAfter).length === 1, 'no duplicate match-end');
console.log('✓ duplicate full-time does not re-emit');

console.log('\nMATCH-END VERIFY (B2) PASSED ✅');
