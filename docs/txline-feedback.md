# TxLINE API — Feedback (dated, specific)

> Our honest experience building **Hatrick** on TxLINE for the TxODDS World Cup Hackathon 2026.
> We built the *entire* product on this feed, so this is feedback from real dependence, not a smoke test.
> Where we were wrong, we say so.

## Overall

A strong developer experience — reliable enough that scores, clock, play-by-play, lineups, odds,
replays, settlement, and fantasy card progression all derive from TxLINE. Nothing on screen is typed
in. We'd build on it again.

## What we liked most

- **Credential-free guest JWT.** `POST /auth/guest/start` returns a 30-day token with an empty body —
  we were streaming within minutes, before any wallet or payment.
- **One normalized schema, one ingest path.** Scores and odds share a consistent JSON shape, so a
  single normalizer handles every fixture; new consumers (live view, fantasy engine, crowd) attach
  without touching ingest.
- **The free World Cup tier really is free.** `POST /api/token/activate` after an on-chain `subscribe`
  activates a working token at **0 TxL** — a `transferChecked` of zero. Clean and self-describing.
- **SSE with `Last-Event-ID` resume.** Reconnect-and-resume let us survive drops *and* replay finished
  matches through the exact same live pipeline — the backbone of our demo, since the group stage ends
  before judging.
- **The `confirmed` boolean is a gift.** A single flag cleanly separates optimistic (`confirmed=false`)
  from authoritative (`confirmed=true`) — it's the hinge of our whole DURING/AFTER architecture.

## Where we hit friction (dated)

- **[04 Jul] The host *is* the network selector — and failure is silent.** The docs don't state that
  devnet auth, activation, and data must all use `https://txline-dev.txodds.com`. Calling
  `/api/token/activate` on the prod host with a devnet `txSig` fails with a 30-second CloudFront **504**,
  not a clear error. One doc line — *"the host is the network selector; use `txline-dev` end-to-end for
  devnet"* — would have saved us hours.
- **[05 Jul] Free-tier docs contradict themselves.** Quickstart implies no `txSig` is needed, but
  activation actually requires the on-chain `subscribe`. The two pages should agree.
- **[06 Jul] The devnet Anchor IDL is stale** versus the deployed program, so we couldn't generate the
  `subscribe`/activate instruction from it — we reversed a live subscribe transaction to build it by hand.
- **[10 Jul] Wire shape ≠ documented schema.** The live SSE uses Capitalized keys (`FixtureId`,
  `Action`, `Confirmed`, `Score`, `Stats`) and an authoritative `Action` string, not the lowercase
  `dataSoccer.Goal` boolean-flag shape the schema implies. We wrote a defensive mapper that tolerates
  both casings and never throws.
- **[11 Jul] Only 4 team totals are provided** (goals, corners, yellow/red cards, via `Score.Total`).
  **Shots-on-target, fouls, and offsides are totalled nowhere** — we tally them client/server-side from
  the discrete action rows. There is also **no possession percentage** (only qualitative possession-state
  rows), so we derive a territorial lean from the stats the feed does carry.
- **[11 Jul] Events carry `playerId` only; there is no roster endpoint.** The single source of a player
  name in the whole feed is the pre-kickoff `action=lineups` frame (~40 min before KO). Naming events
  therefore means pre-scanning history to reconstruct a `playerId → {name, shirt}` map. A lightweight
  players/roster lookup would remove a lot of work.
- **[12 Jul] Score truth is subtle.** A goal is emitted once unconfirmed, re-confirmed twice, and can be
  reversed via `action_discarded` — so counting `goal` actions double-counts. `Score.Total.Goals` is the
  only authority, and it's sparse (absent key = 0). Worth calling out prominently; it's an easy trap.
- **[12 Jul] `Total` includes extra time.** Standard 1X2 / Over-Under settle on the 90-minute result, so
  a knockout decided in ET would settle wrong on `Total`. We derive a regulation-only (H1+H2) score.
  Shootout goals living isolated in `PE` is the right call and helped here.

## Two claims we retracted (the bug was ours)

We'd rather show the correction than an inflated complaint:

- **"There's no half-time finalisation event."** False — `halftime_finalised` **does** exist; our own
  ingest filter was skipping it, which is why a mid-match join briefly mislabeled the period. We fixed the
  filter, not the feed.
- **"The odds stream only carries Over/Under."** False — **1X2 is in the stream**; what we'd inspected was
  a single pre-match snapshot interval that happened to be sparse. Live, the market catalogue is there.

## A note on validation / settlement

We do **not** use `/api/scores/stat-validation` or the on-chain `validate_stat` CPI. The organizers
confirmed it is *recommended, not required*, and aimed at the Prediction Markets & Settlement track. As a
Consumer & Fan app we settle from the authoritative `confirmed=true` result. Also confirmed with the
organizers and reflected in our docs: **odds are TxODDS consensus prices, not per-bookmaker feeds** — a
detail worth stating in the odds docs, as we initially mislabeled them.

## Endpoints we used

`POST /auth/guest/start` · `POST /api/token/activate` · `GET /api/scores/stream` (SSE) ·
`GET /api/odds/stream` (SSE) · `GET /api/fixtures/snapshot` · `GET /api/scores/snapshot/{fixtureId}` ·
`GET /api/odds/snapshot/{fixtureId}` (`?asOf=`) · `GET /api/scores/updates/{epochDay}/{hour}/{interval}` ·
`GET /api/odds/updates/{epochDay}/{hour}/{interval}` — two headers per request:
`Authorization: Bearer <jwt>` + `X-Api-Token: <token>`.

---

*Thanks to the TxLINE team for a genuinely usable real-time feed — the friction above is offered to make
a good product better, not as a complaint.*
