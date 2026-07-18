# Hatrick — Technical Documentation

> **Track:** Consumer & Fan Experiences · TxODDS World Cup Hackathon 2026
> **Live:** [hatrick.xyz](https://hatrick.xyz) · **Repo:** [github.com/project-hattrick/hat-trick](https://github.com/project-hattrick/hat-trick)
> **Network:** Solana devnet · test tokens only — no real money moves.

This is the complete technical writeup for the judges: what Hatrick is, how the TxLINE feed
drives every surface, how the four Solana programs work, and an honest account of what is real
versus simulated. For the quick version see [`submission.md`](submission.md); for a speaking guide
see [`judge-briefing.md`](judge-briefing.md); for our dated API feedback see
[`txline-feedback.md`](txline-feedback.md); for the country-by-country rollout & compliance model see
[`market-rollout-compliance.md`](market-rollout-compliance.md); and for organizer guidance + API facts
we aligned to, see [`hackathon-qa-intel.md`](hackathon-qa-intel.md).

---

## 1. TL;DR for reviewers

- **A working product, not a mockup.** Live on devnet with real transactions end-to-end — pack
  mints, bet escrow, duel stakes, and settlements all link straight to Solscan.
- **TxLINE is the primary input, not a garnish.** Score, clock, play-by-play, lineups, odds,
  replays, settlement, and fantasy card progression all derive from the feed. Nothing on screen is
  typed in.
- **The data becomes play.** Instead of another dashboard or pundit bot, the feed powers a *playable*
  2D live match you watch and bet, and a 1v1 fantasy duel simulated from real player stats.
- **A non-crypto fan can use it in under a minute.** Email sign-in silently creates a Solana wallet
  (Privy); test funds are one tap; no extension, no seed phrase.
- **Real-time is structural.** Every event fires twice — an optimistic `during` for instant UI and a
  confirmed `after` for money — so responsiveness and trust are separate, visible guarantees.

---

## 2. Product overview

Hatrick unifies what a World Cup fan does across five disconnected apps — watch, follow odds, play
fantasy, manage a wallet, socialize — into one platform, one profile, one wallet, powered by a single
real-time feed. Two connected modes:

- **Live** — a real match rebuilt as a watchable 2D game: full play-by-play with real player names, a
  live odds board, and on-chain betting (devnet) that settles itself from the authoritative full-time
  result. Finished matches replay in the same engine at 1× to 8×.
- **Fantasy** — buy packs of limited-edition Metaplex Core NFT cards (serial-numbered, capped supply,
  provably-fair pulls), build an XI, and fight 1v1 duels simulated server-side from the cards' real
  tournament stats, with stakes escrowed on-chain. After each match, TxLINE data buffs or nerfs the
  cards involved.

The originality is the pairing: **not a dashboard *about* the data — a game *made of* it.**

---

## 3. System architecture

The backend is a NestJS monorepo built around **`@nestjs/event-emitter`** and a two-state emission
contract. One feed in; every surface downstream.

```
TxLINE SSE (scores + odds)
        │  fetch() stream · reconnect + resume (Last-Event-ID) · heartbeat
        ▼
[txline-service]  ingest → normalizer ── emits typed domain events ─┐
        │  keeps in-memory tournament state                          │
        ▼                                                            ▼
   (Kafka, optional)                              *.during  (confirmed=false → optimistic, animate now)
        │                                         *.after   (confirmed=true  → authoritative, settle)
        ▼                                                            │
[hattrick-layer]  NestJS · Prisma/Postgres · Redis  ── listeners:  betting settle · fixture-events
        │            fantasy attributes · statistics · crowd          persistence · duel orchestration
        ▼
   socket.io gateway ── broadcasts both states ──► [frontend] Next.js
                                                     animate on .during · reconcile on .after
```

### The two-state contract (the core rule)

Every domain event is emitted **twice** over its lifetime, keyed on the score event's `confirmed`
boolean:

| State | Trigger | Purpose |
|---|---|---|
| `*.during` | TxLINE event with `confirmed=false` (or our optimistic projection) | instant UI / animation; provisional, may be revised |
| `*.after` | TxLINE event with `confirmed=true` | authoritative; settles bets, recomputes fantasy attributes, locks the score |

The frontend treats `.during` as provisional (animate, allow rollback) and `.after` as final (lock,
settle, recompute). This is what makes the UI feel instant **and** trustworthy — they are two
different events, not one guess. All event names are enums; payloads are typed DTOs.

### Why event-driven

One feed, many consumers get the same event at the same instant → consistency. New listeners (crowd,
narration, analytics) attach without touching the ingest path.

---

## 4. TxLINE integration (the required live input)

### 4.1 Authentication

Every data request carries **two headers**:

- `Authorization: Bearer <guest JWT>` — fetched live via `POST /auth/guest/start` (valid ~30 days,
  auto-refreshed on 401).
- `X-Api-Token: <api token>` — the free-tier API token obtained via `POST /api/token/activate` after
  an on-chain `subscribe` transaction to the TxLINE devnet program (the World Cup service level is
  free — a `transferChecked` of 0 TxL).

**Gotcha we learned:** the host *is* the network selector. Devnet auth, activation, and data must all
use `https://txline-dev.txodds.com`; mixing hosts fails silently with a 30s 504.

### 4.2 Endpoints we use

Verified against the running code — this is the complete list.

| Method · Endpoint | What it carries | How Hatrick uses it |
|---|---|---|
| `POST /auth/guest/start` | guest JWT | live auth, auto-refresh |
| `POST /api/token/activate` | API token (after on-chain subscribe) | provisions the `X-Api-Token` sent on every call |
| `GET /api/scores/stream` (SSE) | live events: goals, cards, corners, possession-state, lineups, clock | the heartbeat — drives the 2D arena, score, play-by-play |
| `GET /api/odds/stream` (SSE) | TxODDS consensus odds (1X2 / match-winner, over-under) | odds board + bet slip; the price you bet is the feed's price |
| `GET /api/fixtures/snapshot` | fixtures (optional `?startEpochDay=`) | group table, upcoming matches, replay catalog, id→name maps |
| `GET /api/scores/snapshot/{fixtureId}` | latest score-event snapshot per action | authoritative score/stats + late-join backfill |
| `GET /api/odds/snapshot/{fixtureId}` | latest odds (optional `?asOf=` point-in-time) | pre-match odds where the live stream is empty |
| `GET /api/scores/updates/{epochDay}/{hour}/{interval}` | historical 5-min interval of score events | replay of finished matches |
| `GET /api/odds/updates/{epochDay}/{hour}/{interval}` | historical 5-min interval of odds | replay odds board |

> We do **not** consume TxLINE's `/api/scores/stat-validation` endpoint or its `validate_stat` CPI —
> trustless verification of the feed's own Merkle proofs on-chain is on our roadmap, not in this build.
> (Our `hattrick_betting` program does settle via its own oracle-signed Merkle of results — that's our
> settlement mechanism, unrelated to TxLINE's validation endpoint.) The organizers confirmed the
> `validate_stat` CPI is recommended, not required, and is aimed at the Prediction Markets & Settlement
> track — a consumer app that settles from the authoritative confirmed result is in scope. We call this
> out so the claim is honest.

### 4.3 Making sparse data watchable (the gap-filler engine)

The feed emits a handful of discrete rows per minute — perfect truth for settlement, not enough motion
for a continuous pitch. Between rows we run a **gap-filler**: it derives a possession lean + tempo from
the stats the feed *does* carry (shots, shots-on-target, corners, possession-family events, fouls,
offsides) and drives autonomous connective play — dribbles, passes, ball-steals, **never a fabricated
shot**. Any real event always overrides it. What's on screen between rows is still a function of real
data, not fiction.

### 4.4 Naming events

Events carry `playerId` only; there is no queryable roster endpoint. The single source of a name in
the whole feed is the `action=lineups` frame, embedded in the scores stream ~40 min before kickoff. So
we pre-scan history backward to before kickoff, reconstruct a `playerId → {name, shirt}` map, and join
it onto every event — server-side for replay, and the same join again on the client for live.

### 4.5 Stats we compute ourselves

The feed totals only goals, corners, and cards. Shots-on-target, fouls, and offsides are **tallied
client/server-side from the discrete rows** (deduped by a stable per-event sequence, so a
during/after pair isn't double-counted). Possession has no percentage in the feed, so we **derive** a
territorial lean from the stats it does carry. This is why a mid-match joiner still gets correct
running totals — we replay the snapshot to rebuild them.

### 4.6 Replay through the same pipeline

Because the 104 group-stage matches end before judging, the demo replays **real recorded TxLINE
history** through the exact live pipeline. Historical 5-minute intervals feed a client-side clock
(`useReplayClock`): play/pause/restart, speed switchable live from 1× to 8×, key-event markers on the
bar. Every event, name, and score on screen is real feed data.

---

## 5. Solana / on-chain (devnet)

State is **chain-authoritative with a Postgres mirror**: the source of truth lives on-chain, the DB
mirrors it for fast reads and to gate the UI. Four independent Anchor programs (Anchor 0.31.1):

| Program | ID (devnet) | Role |
|---|---|---|
| `hattrick_betting` | `GhGZEarksLDfSDHg98PKm2xZuHJjSE8Zujd9mBB8zqXc` | Pari-mutuel match markets; positions in on-chain pools; oracle-signed settlement |
| `hattrick_fantasy` | `67QvSGTacjzuQFJujCREMWtRVonCLypqKmK2dszVdDwz` | 1v1 duel USDC escrow; both players deposit; settlement gated on seed reveal |
| `hattrick_packs` | `BtgAtofxN8RJxaC824XUeamCZL13b63u2YaVTvhVGfFo` | Provably-fair card packs; mints Metaplex Core NFTs; layer controls vaults |
| `hattrick_provably_fair` | `DsWff3P22AsnXAk7EthHNythzDWLc7bg5JS3aPpNjsLQ` | Commit-reveal seed oracle; gates fantasy settlement and pack fulfillment on `is_revealed` |

### 5.1 Sign-in with zero wallet friction

Email login through **Privy** creates an embedded Solana wallet invisibly — no extension, no seed
phrase. A faucet mints test USDC on devnet in one tap (the platform wallet is the mint authority).
Phantom also works for users who prefer it.

### 5.2 Betting flow

Place bet → backend builds an unsigned `place_position` tx → user signs → confirmed on-chain → DB
mirror updated. On `match-end.after` (the authoritative TxLINE result), the backend settles the market
— no human approves a payout.

### 5.3 Duel flow (provably fair)

1. Backend (layer-signed) `initialize_duel` — creates the escrow — and `commit_seed` to the
   provably-fair program, **before kickoff**.
2. Each player signs their own `deposit_stake` into the escrow.
3. At full time the seed is revealed on-chain and `settle_duel` runs — **gated on `is_revealed`**, so
   the result cannot be manipulated after the commitment. Not even we can rig it.

### 5.4 Packs flow

Pack purchase commits a seed to provably-fair (before opening) and mints **Metaplex Core NFTs** —
serial-numbered, capped supply. Fulfillment is gated on the seed reveal. Card ownership and metadata
live on-chain (`OwnedCard.assetMint` mirrors it in the DB).

### 5.5 Proof + off-chain fallback

Every pack buy, bet, and settlement surfaces a **"View on Solscan"** link (`?cluster=devnet`). A
single flag `CHAIN_ENABLED=false` routes the same flows through a DB test-USDC ledger — a safe
fallback if anything on-chain misbehaves during judging, with no other change needed.

> Terminology note: the cards are **Metaplex Core NFTs**, not compressed "cNFTs" — the `hattrick_packs`
> program mints via `mpl_core`.

---

## 6. Fantasy mechanics

### 6.1 Cards → XI → duel

Open packs to reveal cards (fixed ratings, nation, rarity), build an XI, then challenge another real
user (direct challenge or ranked queue; a CPU fallback keeps the demo alive if no human is waiting).
Set a stake, both sides escrow on-chain, the duel runs on both screens.

### 6.2 How the winner is decided

The simulation is **server-authoritative**: each card carries its player's latest real stats
(`loadSquadPayload`), the two squad payloads go into the sim, and the outcome is **deterministic,
seeded from the on-chain seed commitment** (the same replay log animates the arena on both devices).
Squad rating biases chance probability — a stronger XI earns more and better chances. No client can
influence the result.

### 6.3 Card form from TxLINE data (the feed writes onto the cards)

After real matches, cards move based on the feed:

- **Nation layer** — a fixture's authoritative final score buffs/nerfs every card of that nation
  (±1–3 form).
- **Player layer** — the real scorers from the match timeline react twice.
- **Matching** — real named players match by name; fictional cards resolve by **nation flag + shirt
  number + position** (never by name), which is compliance-safe and works for any card.
- **Upcoming impact** — a forward-looking panel maps real scheduled fixtures to the nations you own and
  shows the projected swing per card, so you can see which cards are on the line before you set your XI.

---

## 7. Live mode mechanics

The home is a live match dashboard, every widget sourced from the feed:

| Widget | Source |
|---|---|
| Scorebar (score + clock) | scores SSE |
| Events feed (full play-by-play with names) | discrete feed events + lineups; replay uses the history endpoint, live uses the socket + Redis backfill |
| Team stats (shots on target, fouls, offsides, possession) | totals computed from discrete events; possession derived |
| Lineups | official lineups from the feed |
| Odds board + bet slip | odds SSE (1X2 / over-under) |
| Upcoming odds | odds SSE merged with `asOf` snapshots |
| My bets | locked odds vs live price; position mirrored from chain |
| Group table | fixtures snapshot |

The 2D arena itself is driven by the feed's events — shots, corners, goals, and cards become scenes in
the engine.

---

## 8. Tech stack

| Layer | Stack |
|---|---|
| **Frontend** | Next.js (App Router) · React · Tailwind · shadcn/ui · Zustand (state) · React Query (fetching) · framework-free canvas 2D match engine · Privy (email → embedded wallet) |
| **Backend** | NestJS · `@nestjs/event-emitter` · Prisma · Postgres · Redis · Kafka (optional) · socket.io · Zod DTOs · TypeScript |
| **Blockchain** | Solana devnet · Anchor 0.31.1 (4 programs) · Metaplex Core · `@solana/web3.js` · SPL tokens |
| **Data** | TxLINE (SSE scores + odds, REST snapshots, historical intervals) |

Frontend never calls `fetch`/`axios` directly from components — all network access lives in
`src/services/`. All match/market/game constants are enums, never magic strings.

---

## 9. Running it

- **Live:** [hatrick.xyz](https://hatrick.xyz). Sign in with an email, tap **Get test funds**, buy the
  starter pack, then watch/bet the live match on the home or duel from `/duelists`. In a restricted
  region, append `?geo=demo`.
- **Local:** `api/` → `docker compose up -d && npm i && npm run prisma:deploy && npm run start:dev`;
  `front/` → `npm i && npm run dev` (`NEXT_PUBLIC_USE_MOCK=false`). Envs documented in each app's
  `.env.example`. The API boots cleanly without a Kafka broker (producer buffers; duels use a
  layer-side fallback settle).

---

## 10. Compliance & responsible gaming

- **No FIFA IP** — no official branding, logos, marks, or implied affiliation. Player names arrive as
  factual TxLINE data (OK to display); card art is stylized and does not match real players (no
  likeness).
- **18+ age gate** — blocking, non-dismissible.
- **Self-exclusion + stake limits** — in Settings, gating both the UI and the API.
- **Geo-blocking** — betting surfaces are blocked in restricted jurisdictions (judges append
  `?geo=demo` to bypass).
- **Devnet only** — fictitious test tokens; no real money moves. Play-money disclaimer in the footer.
- **Essential-only cookies** — no analytics gate.

---

## 11. Honest scope — real vs simulated

We would rather show the seams than oversell.

| ✅ Real (live / on-chain) | 🎭 Simulated (for the demo) |
|---|---|
| TxLINE SSE ingest — scores + odds | Crowd speech balloons & social picks |
| On-chain TxLINE token activation (devnet) | CPU opponent fallback when no human is queued |
| 4 Anchor programs — betting escrow, duel escrow, packs/mint, provably-fair | — |
| Betting markets + settlement from `*.after` | — |
| Fantasy 1v1 vs real users (direct challenge + ranked queue) | — |
| Match replay through the real pipeline | — |

**Known gaps:** the card marketplace settles off-chain (a DB ledger; mint and all money flows are
on-chain); synthetic betting markets beyond 1X2 / over-under aren't derived yet; crowd ambience outside
rooms is front-simulated; and because the feed carries no possession percentage, the pitch's
territorial lean is derived from the stats TxLINE does provide.

---

## 12. Team

| Name | Role | GitHub |
|---|---|---|
| Kauã Miguel | Owner | [@Kc1t](https://github.com/Kc1t) |
| Deborah Pavanelli Colicchio | Member | [@eudehh](https://github.com/eudehh) |
| Pedro Henrique | Member | [@opedrooz](https://github.com/opedrooz) |
