# TxLINE — Provider Reference (our single source of truth)

> Everything we know about the TxLINE API, verified from the official docs. **Don't re-research** — update this file instead.
> Top-level docs: [Quickstart](https://txline.txodds.com/documentation/quickstart) · [World Cup](https://txline.txodds.com/documentation/worldcup) · **Full machine index** [`llms.txt`](https://txline-docs.txodds.com/llms.txt)

## TL;DR
- Real-time **scores** and **odds** over **SSE**; REST **snapshots** for initial state; **Merkle proofs** + on-chain `validate_stat` for trustless settlement (Phase 2).
- Every data call needs **two headers**: `Authorization: Bearer <JWT>` **and** `X-Api-Token: <API_TOKEN>`.
- **World Cup + EPL are free tier** for the hackathon (through 2026-07-19). We target **Solana devnet**.
- The score event's **`confirmed` boolean** is the hinge of our architecture → `false` ⇒ emit `*.during`, `true` ⇒ emit `*.after`.

## Hosts — ⚠️ network must match the on-chain program
The host **is** the network selector. Auth, activation, and data must all hit the host for the **same** network you subscribed on. Mixing them = the backend looks for your `txSig` on the wrong cluster, never finds it, and hangs → **CloudFront 504** (not a clear error).
- **Devnet (our target):** `https://txline-dev.txodds.com` — pairs with program `6pW64gN1…`, TxL mint `4Zao8ocP…`. Use this host for `/auth/guest/start`, `/api/token/activate`, **and** all `/api/...` data.
- **Mainnet:** `https://txline.txodds.com` — pairs with program `9ExbZjAa…`, TxL mint `Zhw9TVKp…`.
- Our `.env`: `TXLINE_BASE_URL=https://txline-dev.txodds.com`. **Activated free-tier token in place** (`TXLINE_API_TOKEN`, subscribed via devnet `subscribe` service level 1, 0 TxL). Re-activation flow scripted in `project/api/scripts/txline/`.

## Authentication
1. **Guest JWT** — `POST /auth/guest/start` (empty body) → `{ "token": "<JWT>" }`. **Valid 30 days.** On `401`, re-acquire.
2. **API token** — `POST /api/token/activate` with `{ txSig, walletSignature, leagues }` → long-lived API token. (Free tier still activates, no payment.)
3. Send both `Authorization: Bearer <JWT>` and `X-Api-Token: <API_TOKEN>` on every data request.

Status codes: `200` ok · `400` bad headers/params · `401` JWT expired (refresh) · `403` bad API token / no permission · `500` server.

## Endpoint index

| Purpose | Method · Path | Notes |
|---|---|---|
| Guest JWT | `POST /auth/guest/start` | empty body → `{token}` |
| Activate API token | `POST /api/token/activate` | `{txSig, walletSignature, leagues}` |
| **Scores SSE** | `GET /api/scores/stream` | `?fixtureId=` opt · resume header `Last-Event-ID: ts:index` · `heartbeat` events |
| **Odds SSE** | `GET /api/odds/stream` | `?fixtureId=` opt · same resume/heartbeat |
| Fixtures snapshot | `GET /api/fixtures/snapshot` | `?startEpochDay=&competitionId=` |
| Fixtures updates (hourly) | `GET /api/fixtures/updates/{epochDay}/{hourOfDay}` | fixture changes for that hour |
| Odds snapshot (1 fixture) | `GET /api/odds/snapshot/{fixtureId}` | ✅ path confirmed (spec 1.5.6) · `?asOf=` = historical point-in-time. **Gotcha:** without `asOf` it only answers from the current 5-min interval → can be empty pre-match (our service retries with `asOf=now`) |
| Scores snapshot (1 fixture) | `GET /api/scores/snapshot/{fixtureId}` | ✅ path confirmed · returns the **last event per action** (⇒ 1 call recovers `lineups`) · `?asOf=` historical |
| Scores current interval (1 fixture) | `GET /api/scores/updates/{fixtureId}` | live, current 5-min interval — catch-up on join |
| Odds current interval (1 fixture) | `GET /api/odds/updates/{fixtureId}` | live, in-memory 5-min cache |
| Scores full history (1 fixture) | `GET /api/scores/historical/{fixtureId}` | whole match in 1 call — only for start time **6h–2wk in the past** |
| **3-stage Merkle proof** | `GET /api/scores/stat-validation` | legacy `?statKey=[&statKey2=]` · **V2** `?statKeys=1001,1002,…` (N-stat) → feeds `validate_stat`/`validate_stat_v2` |
| Merkle **multiproof** (v3) | `GET /api/scores/stat-validation-v3` | `?statKeys=` (1–5 keys), compressed multiproof |
| Merkle proof (odds) | `GET /api/odds/validation` | `?messageId=&ts=` |
| Merkle proof (fixture / batch) | `GET /api/fixtures/validation` · `GET /api/fixtures/batch-validation` | `?fixtureId=[&timestamp=]` · `?epochDay=&hourOfDay=` |
| Historical 5-min interval | `GET /api/{odds,scores}/updates/{epochDay}/{hour}/{interval}` | backfill / demo replay (odds replay has no `/historical` — intervals only) |
| Purchase quote (unused, free tier) | `POST /api/guest/purchase/quote` | `{buyerPubkey, txlineAmount}` · 1000 TxL = 1 USDT, 0% fee |

### Doc links (per area)
- **Auth:** [start guest](https://txline-docs.txodds.com/api-reference/authentication/start-a-new-guest-session) · [activate token](https://txline-docs.txodds.com/api-reference/authentication/activate-subscription-and-retrieve-api-token)
- **Scores:** [SSE](https://txline-docs.txodds.com/api-reference/scores/get-a-real-time-server-sent-events-stream-of-scores-updates) · [3-stage proof](https://txline-docs.txodds.com/api-reference/scores/get-a-three-stage-merkle-proof-for-a-single-score-statistic) · [snapshots](https://txline-docs.txodds.com/api-reference/scores/get-snapshots-for-each-action-in-the-latest-score-events-for-a-fixture) · [full sequence](https://txline-docs.txodds.com/api-reference/scores/get-the-full-sequence-of-score-updates-for-a-single-fixture)
- **Odds:** [SSE](https://txline-docs.txodds.com/api-reference/odds/get-a-real-time-server-sent-events-stream-of-odds-updates) · [live one fixture](https://txline-docs.txodds.com/api-reference/odds/get-currently-live-odds-updates-for-a-single-fixture) · [snapshots](https://txline-docs.txodds.com/api-reference/odds/get-snapshots-of-the-latest-odds-for-a-fixture)
- **Fixtures:** [snapshot](https://txline-docs.txodds.com/api-reference/fixtures/get-the-latest-snapshot-of-fixtures-optionally-starting-at-or-within-30-days-after-a-given-epoch-day) · [per-day updates](https://txline-docs.txodds.com/api-reference/fixtures/get-all-fixture-updates-for-a-single-fixture-on-a-given-day)
- **Programs:** [addresses](https://txline-docs.txodds.com/documentation/programs/addresses) · [devnet](https://txline-docs.txodds.com/documentation/programs/devnet) · [mainnet](https://txline-docs.txodds.com/documentation/programs/mainnet)
- **Examples:** [streaming](https://txline-docs.txodds.com/documentation/examples/streaming-data) · [snapshots](https://txline-docs.txodds.com/documentation/examples/fetching-snapshots) · [on-chain validation](https://txline-docs.txodds.com/documentation/examples/onchain-validation)

## Event schemas (key fields)

**Score event** (the `data` of an SSE message):
```
fixtureId, gameState, action, ts, seq, confirmed,      // confirmed=false→DURING, true→AFTER
type ("Soccer"), statusSoccerId (NS|H1|HT|H2|ET1|ET2|P|PE|FET|FPE|…|END),
scoreSoccer.{Participant1,Participant2}.{H1,HT,H2,ET1,ET2,PE,ETTotal,Total}
           .{Goals,YellowCards,RedCards,Corners},     // per-PERIOD breakdown; PE = shootout, isolated
dataSoccer.{Action,Type,PlayerId,PlayerInId,PlayerOutId,Participant,Minutes,Goal,GoalType,
            Penalty,YellowCard,RedCard,VAR,Corner,FreeKickType,ThrowInType,Outcome,
            Conditions[]},                             // Conditions = weather/pitch strings
playerStatsSoccer.{Participant1,Participant2}.{playerId}: // sparse cumulative counters (since 04/07)
            {goals, shots, ownGoals, penaltyAttempts, penaltyGoals, yellowCards, redCards},
partiNStateSoccer.PossibleEvent.{Goal,Penalty,Corner},  // "possible goal" flags — explain score flicker
possibleEventSoccer.{RedCard,YellowCard,VAR},
lineups[], possession, possessionType ("Attack|Danger|HighDanger|Safe")
```
SSE wrapper: data messages `{"id":"ts:index","data":{…}}`; keepalive `{"event":"heartbeat","data":{"Ts":123}}`.
Since 03/07, `action=game_finalised` carries **`statusId/period = 100`** — a single terminal marker across regulation/ET/pens/abandoned (we still key on the action string, never on `statusId`).
`action=lineups` arrives **~40min before kickoff** — `LineupData` per team → `lineups[].{fixturePlayerId, rosterNumber, positionId, starter, player.{normativeId, preferredName…}}`. `PlayerStats` keys = player **normativeId**. We drop names at the mapper (CODE-N identity rule).

**Odds payload:**
```
FixtureId, MessageId, Ts, Bookmaker, BookmakerId, SuperOddsType, InRunning   // required
GameState?, MarketParameters?, MarketPeriod?, PriceNames[]?, Prices[]?, Pct[]?  // optional
```

**Fixture:** `FixtureId, StartTime, Ts, Competition, CompetitionId, FixtureGroupId, Participant1Id, Participant1, Participant2Id, Participant2, Participant1IsHome`.

## Consuming SSE (verified pattern)
```ts
const res = await fetch(`${BASE}/api/scores/stream`, {     // or /api/odds/stream
  headers: {
    Authorization: `Bearer ${jwt}`,
    "X-Api-Token": apiToken,
    Accept: "text/event-stream",
    "Cache-Control": "no-cache",
    // "Accept-Encoding": "gzip",  // optional; decompress with zlib
    // "Last-Event-ID": `${ts}:${index}`, // optional resume
  },
});
if (!res.ok) throw new Error(`Stream failed: ${res.status}`);
const reader = res.body!.getReader();
const decoder = new TextDecoder();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  for (const line of decoder.decode(value).split("\n")) {
    if (line.trim()) handleLine(line); // parse SSE; skip heartbeats; track Last-Event-ID
  }
}
```
> The docs' sample has **no** reconnection/heartbeat/resume logic — **we own** backoff + resume in `api/txline`.

## Snapshots on connect (verified pattern)
`axios` with the two headers + `baseURL`. Fetch snapshot first (baseline), then subscribe to the stream for deltas:
```
GET /api/fixtures/snapshot[?competitionId=…]
GET /api/odds/snapshot/{fixtureId}
GET /api/scores/snapshot/{fixtureId}
```
New WS clients on our side get current in-memory state immediately (no feed replay needed).

## Real wire schema ≠ the docs (verified) + historical replay
- **The live SSE and historical events use Capitalized keys** — `FixtureId, GameState, Action, Ts, Seq, Confirmed, Participant, Clock:{Seconds}, Stats:{…}, Data:{}` — **not** the lowercase `dataSoccer.Goal`/`scoreSoccer` shape this doc's schema implies. The `Action` string is authoritative (`shot, goal, yellow_card, corner, danger_possession, substitution, game_finalised…`); goals/cards are **not** boolean flags. Both ingest paths funnel through `api/src/txline/services/txline-mapper.ts` which adapts wire → internal `RawScoreEvent`. Odds already match `RawOddsEvent` (Capitalized).
- **Full-time signal is the `game_finalised` action**, not `GameState` (which can stay `"scheduled"` all match). The mapper surfaces it as `FullTime` so `match-end.after` settles.
- **Score comes from the `Score` object, never by counting `goal` actions.** A single goal is emitted once as `Confirmed:false` then **re-confirmed 2× as `Confirmed:true`** — counting actions double-counts, and goals can be reversed via `action_discarded`. `Score.ParticipantN.Total.Goals` is authoritative; it's **sparse** (a 0 count omits the `Goals` key → treat absent-but-Score-present as 0). The mapper is fully defensive (tolerates both casings, missing/garbage fields, never throws, returns `null` for unroutable frames) and logs unknown actions once (drift watch). Covered by `scripts/txline/test-mapper.mjs`.
- **`Total` includes extra time — settle 1X2/OU on regulation (H1+H2).** Standard market semantics settle on the 90-minute result; a knockout game decided in ET would settle wrong on `Total`. The mapper derives `regulationHomeGoals/regulationAwayGoals` (H1+H2), the normalizer puts `regulationScore` on events and `regulationHomeScore/regulationAwayScore(+regulationOutcome)` on `match-end.after`, `/fixtures/{id}/score` exposes `regulationHome/regulationAway`, and the front's `resolveByScore` settles on regulation when present. Shootout goals live isolated in `PE` and never contaminate `Total`.
- **`Score.Total.Goals` can flicker on unconfirmed frames** (possible-goal handling; confirmed by TxLINE 06/07 — expected behavior). Only `Confirmed:true` events drive settlement; the `during` score is optimistic by design.
- **`PlayerStats` is cumulative per player and sparse** — the mapper normalizes `{Participant1,Participant2}` → `{home,away}` maps of the 7 counters; the front tallies them per fixture (seq-guarded, last-write-wins so VAR reversals can lower counts) and drives the on-the-ball card + live form boost. Recover lineups anytime with **one** `/api/scores/snapshot/{fixtureId}` call (last event per action).
- **Team-stat totals: only 4 exist — read them from `Score.Total`, never by counting actions** (verified 12/07 on ARG-SUI). The only authoritative team totals are `Score.ParticipantN.Total.{Goals,YellowCards,RedCards,Corners}`, mirrored flat in the `Stats` object: keys `1/2`=Goals H/A, `3/4`=YellowCards, `5/6`=RedCards, `7/8`=Corners; `X001–X008` repeat those 8 per period (`X`=1..7 → H1/HT/H2/ET1/ET2/PE/ETTotal). **Shots** live only in sparse `PlayerStats.{player}.shots` (sum per side; frequently absent). **Shots-on-target, fouls, offsides are NOT totalled anywhere** — only derivable by counting the live action stream. ⚠️ The scores **snapshot returns the last event per action**, so *counting* actions from it undercounts badly (an 8-corner match reads as **1**). Our `/fixtures/{id}/stats` reads corners/cards from `Score.Total` + shots from PlayerStats; the mapper surfaces the counters on `RawScoreEvent`/`MatchEventPayload.teamStats` so the live socket carries them (cumulative → mid-join safe), and the front's action tally fills SOT/fouls/offsides, all merged monotonically.
- **Historical replay** (`api/src/txline/services/txline-replay.service.ts`): pulls `/api/{scores,odds}/updates/{epochDay}/{hour}/{interval}` for one fixture, dedupes boundary-straddling events (by `Seq:Confirmed:Ts` / `MessageId`), orders by `Ts`, and re-emits through the **same normalizer** at `speed×` cadence → real `*.during`/`*.after` + odds + settlement with no live match. Trigger: `POST /replay {fixtureId, epochDay, startHour, hours?, speed?}` or `TXLINE_REPLAY_ENABLED=true`. One WC match ≈ **35k frames** (~980 score events + ~33k odds updates).

## On-chain settlement (⏸ Phase 2 — documented, not built yet)
- **3-stage proof** `ScoresStatValidation`: `statToProve(+statToProve2?)`, `eventStatRoot`, `statProof[]`, `subTreeProof[]`, `mainTreeProof[]`, `summary` (`ScoresBatchSummary` w/ `eventStatsSubTreeRoot`). `ProofNode = { hash, isRightSibling }`.
- **`validate_stat`** = read-only `.view()` CPI → `bool`. Args: `ts, fixtureSummary, fixtureProof[], mainTreeProof[], predicate, statA, statB?, op?`. Requires `ComputeBudgetProgram.setComputeUnitLimit(1_400_000)`.
- `daily_scores_roots` PDA seeds: `["daily_scores_roots", epochDay (le u16)]` (+ hour/minute, 5-min boundaries). `validate_stat` discriminator: `[107,197,232,90,191,136,105,185]`.
- **Solana IDs — DEVNET (our target):** program `6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J` (v1.5.2; IDL: 36 ix / 5 accounts), TxL mint `4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG`, USDT mint `ELWTKspHKCnCfCiCiqYw1EDH77k8VCP74dK9qytG2Ujh`. Mainnet program `9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA`.
- ⚠️ **Rule:** the TxL credit token is **locked to TxLINE's program — cannot** be used for P2P staking/escrow. Our escrow uses **another devnet asset** (USDC / wrapped SOL); we only *read* TxLINE proofs to settle.

## Endpoints we use (for the submission writeup)
Auth (`/auth/guest/start`, `/api/token/activate`) · **Scores SSE** (`/api/scores/stream`) · **Odds SSE** (`/api/odds/stream`) · **Fixtures snapshot** (`/api/fixtures/snapshot`) · scores/odds **snapshots** · *(Phase 2)* `/api/scores/stat-validation` + `validate_stat` CPI + Merkle-proof endpoints.

## Open API questions (resolve against live API)
- World Cup **`competitionId`** — discover via `/api/fixtures/snapshot`, then pin it here.
- Odds `PriceNames`/`Prices` market catalogue per `SuperOddsType` — capture real examples once streaming.
- **Odds latency:** spec overview (1.5.6) still says free tier is "sampled every 60 seconds", but TxLINE (Gary, 09/07) said the 60s note was obsolete IDL and streams have **zero** delay. Don't promise "zero delay" in the pitch until we measure it ourselves.
- **Fixture `GameState`** (1=Scheduled, 6=Cancelled) announced 03/07 but absent from spec 1.5.6's `Fixture` schema — verify the wire and handle Cancelled in the ingest sweep when confirmed.
- **Wire key/casing of the data blob and lineups** — the mapper reads `Data/DataSoccer/dataSoccer` and `Lineups/lineups` defensively; log one raw goal + one lineups frame on the next live match to pin the real keys (and whether `PlayerId/GoalType/Conditions` actually arrive).
- **Penalty & VAR frame shape** — TxLINE (Tuborrr, 12/07) confirmed a penalty is *awarded as an event* with a **stat key** (in `txodds-soccer-feed-v1.pdf`). Two unknowns our penalty handling guesses at: (1) does the award arrive as `Action:"penalty"` / `Data.Penalty` or **only** as a stat-key bump (`penaltyAttempts`/`penaltyGoals`) — the latter would never fire `MatchAction.Penalty`; (2) the real `Outcome` vocabulary for miss/save/retake (we special-case `Missed`/`Saved`/`Retake`). A capped raw-frame probe in `txline-ingest.service.ts` (`probePenaltyFrame`) dumps the untouched wire on the next live penalty/VAR — **grep the api logs for `PENALTY-PROBE`**, then replace the guesses with facts and delete the probe. Shootout (`PE`) scoring/UI is a separate open gap.

> Running friction/notes for the required API feedback live in [`txline-feedback.md`](txline-feedback.md).
