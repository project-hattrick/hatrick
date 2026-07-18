# Hatrick — Submission Technical Doc

> One-page brief for the judges. Track: **Consumer & Fan Experiences** (TxODDS World Cup Hackathon
> 2026). **Full technical writeup:** [`technical-documentation.md`](technical-documentation.md).
> Deep-dives are linked throughout.

## TL;DR for reviewers

- **This is a working product, not a mockup**: live at [hatrick.xyz](https://hatrick.xyz), with real
  devnet transactions end-to-end — pack mints, bet escrow, duel stakes, and settlements all link to Solscan.
- **TxLINE is the primary input, not a garnish**: scores, clock, play-by-play, lineups, odds, replays,
  settlement, and fantasy card progression all derive from the feed. Nothing on screen is typed in.
- **The original bet of the project**: instead of another dashboard or pundit bot, the data becomes a
  *playable* experience — a live 2D match you watch and bet, and a 1v1 fantasy duel simulated from
  real player stats.
- **A non-crypto fan can use it in under a minute**: email sign-in silently creates a Solana wallet
  (Privy); test funds are one tap; no extension, no seed phrase.
- **Real-time is structural**: every event fires twice — optimistic `during` for instant UI,
  confirmed `after` for money — so responsiveness and trustworthiness are separate, visible guarantees.

## The idea

**One platform, two ways to play a real match — both driven by the same real-time TxLINE feed.**

- **Live mode** — a real match rebuilt in real time as a watchable 2D game: full play-by-play with real
  player names, a live odds board, and **on-chain betting** (Solana devnet) that settles itself from the
  authoritative full-time result.
- **Fantasy mode** — buy packs of **limited-edition Metaplex Core NFT cards** (serial-numbered, capped
  supply, stats built from real tournament data, provably-fair pulls), build an XI, and fight **1v1
  duels** simulated server-side and settled on-chain.

The originality is the pairing: not a dashboard *about* the data — a game *made of* it. One profile, one
wallet, one feed.

## How TxLINE powers the backend (the required "live input")

```
TxLINE SSE (scores + odds)
  → txline-service  (guest JWT → on-chain subscribe → /api/token/activate;
                     Last-Event-ID resume, heartbeat, backoff)
  → Kafka           (normalized domain events)
  → hattrick-layer  (NestJS · Prisma/Postgres · Redis) — every domain event exists in TWO states:
        *.during  (optimistic, confirmed=false)  → instant UI / animation
        *.after   (authoritative, confirmed=true) → on-chain settlement
      handlers: bets (escrow settle on final result) · fixture-events (play-by-play persistence)
                statistics · rooms/crowd · duels (server-authoritative sim + escrow payout)
  → socket.io gateway → browser (match-event.during/after, odds updates, duel results)
```

The **DURING/AFTER two-state contract** is the spine: the UI reacts instantly on `during`, then
reconciles against the authoritative `after` that also drives settlement. Full pipeline:
[`architecture.md`](architecture.md) · provider details (auth, SSE, IDs, settlement):
[`txline-provider.md`](txline-provider.md).

**Making sparse data watchable:** the feed surfaces a handful of discrete rows per minute — plenty of
truth for settlement, not enough motion for a live pitch. So a **gap-filler engine** derives possession
lean + tempo from the stats the feed *does* carry (shots, corners, possession-family events, fouls) and
plays realistic connective football between rows — dribbles, passes, steals, **never a fabricated
shot** — with every real event overriding it. What's on screen between events is still a function of
real data, not fiction.

**Demo note (honest):** the group stage ends before judging, so the demo replays **real recorded TxLINE
history** (e.g. the finished England 1–2 Argentina) through this exact live pipeline — every event,
player name and score on screen is real feed data; nothing is invented.

## TxLINE endpoints used

Auth: `POST /auth/guest/start`, `POST /api/token/activate` (after on-chain `subscribe`) ·
**Scores SSE** `GET /api/scores/stream` · **Odds SSE** `GET /api/odds/stream` ·
**Fixtures snapshot** `GET /api/fixtures/snapshot` · scores/odds snapshot reads for history/replay.
Authoritative list: [`txline-provider.md`](txline-provider.md#endpoints-we-use). API praise & friction
writeup (dated, specific): [`txline-feedback.md`](txline-feedback.md).

## Solana (live on devnet — not a mockup)

- **Sign-up via Solana with zero wallet friction:** email login through **Privy** creates an embedded
  wallet invisibly; a **TEE session signer** lets the backend co-sign, so betting/packs are one-tap.
- **Four Anchor programs deployed on devnet:**
  1. **Betting** — stake locks into an escrow PDA per market; settlement pays winners from the
     authoritative TxLINE result (no human approves a payout).
  2. **Duels** — 1v1 stakes escrowed and paid to the winner of the server-simulated match.
  3. **Packs / cards** — pack purchase mints **Metaplex Core NFTs** (serial-numbered, capped supply).
  4. **Provably-fair** — ed25519-signed randomness for pack pulls, verifiable on-chain.
- The card **marketplace is off-chain by design** for the hackathon (DB ledger) — primary mint and all
  money flows (bets, duel stakes, pack buys) are on-chain.
- **Devnet only, fictitious tokens (test USDC faucet) — no real money moves.** Solscan links in the
  demo use `?cluster=devnet`.

## Judging criteria → where it lives

| Criterion | Where |
|---|---|
| **Fan Accessibility & UX** | Email → invisible wallet (Privy); one home, two clear modes; age gate + self-exclusion + geo-block baked in |
| **Real-Time Responsiveness** | TxLINE SSE → during/after → WS → UI animates on `during`, reconciles on `after` |
| **Originality & Value** | A playable 2D live match **+** a 1v1 simulated game, unified by one feed — not another pundit-bot |
| **Commercial & Monetization** | Primary packs + marketplace spread + betting margin; TxODDS covers 350+ leagues / 30+ sports, same engine scales past football |
| **Completeness & Execution** | Real backend (Postgres + Redis + Kafka + WS) and real devnet transactions end-to-end — bet escrow, settle, mint |

## Compliance

No FIFA marks (generic art; names are TxLINE data only) · **18+ age gate** (blocking) · self-exclusion +
stake limits · **geo-block on betting surfaces** (BR blocked; judges can append `?geo=demo` to bypass) ·
essential-only cookies · devnet play-money disclaimer in the footer.

## Run it

- **Live:** [hatrick.xyz](https://hatrick.xyz). Sign in with an email, grab test funds (one tap), buy
  the starter pack, then either watch/bet the live match on the home or duel from `/duelists`.
  In a restricted region, append `?geo=demo`.
- **For judges — zero friction, zero cost:** email sign-in creates the Solana wallet for you, the faucet
  funds it, and everything runs on devnet play-money. **No external wallet to connect, no Google account,
  no gas to pay** — matching the organizers' guidance to keep evaluation friction-free.
- **Local:** `api/` → `docker compose up -d && npm i && npm run prisma:deploy && npm run start:dev`
  (`:3001`); `front/` → `npm i && npm run dev` (`:3000`, `NEXT_PUBLIC_USE_MOCK=false`). Envs
  documented in each app's `.env.example`.

## Honest gaps (we'd rather you hear it from us)

Card marketplace settles off-chain (mint + money flows are on-chain); synthetic betting markets beyond
1X2/over-under aren't derived yet; the crowd ambience outside rooms is front-simulated; the feed carries
no possession *percentage* (only qualitative possession-state rows), so the pitch's territorial lean is
derived from the stats TxLINE does provide.
