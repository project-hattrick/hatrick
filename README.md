<a id="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/project-hattrick/hat-trick">
    <img src="front/public/logo.png" alt="Hatrick" width="96" />
  </a>

  <h1 align="center">Hatrick</h1>

  <p align="center">
    One platform, two ways to live the 2026 World Cup — simulated fantasy duels and a live 2D match arena, both driven by the same real-time data source: the <strong>TxLINE</strong> feed on <strong>Solana</strong>.
    <br />
    <a href="https://hatrick.xyz/style-guide" target="_blank">View Design System</a>
    ·
    <a href="https://github.com/project-hattrick/hat-trick/issues" target="_blank">Report Bug</a>
    ·
    <a href="https://github.com/project-hattrick/hat-trick/issues" target="_blank">Request Feature</a>
  </p>

  <p align="center">
    <a href="https://hatrick.xyz" target="_blank"><strong>🌐 Live — hatrick.xyz »</strong></a>
    ·
    <a href="https://x.com/playhatrick" target="_blank"><strong>Follow @playhatrick on X</strong></a>
  </p>

  <p align="center">
    <a href="https://github.com/project-hattrick/hat-trick/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/project-hattrick/hat-trick/ci.yml?branch=main&label=ci&style=flat-square"></a>
    <img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square">
    <img alt="Solana" src="https://img.shields.io/badge/Solana-devnet-14F195?style=flat-square">
    <img alt="Powered by TxLINE" src="https://img.shields.io/badge/powered%20by-TxLINE-orange?style=flat-square">
    <img alt="Hackathon" src="https://img.shields.io/badge/TxODDS%20World%20Cup-2026-black?style=flat-square">
  </p>
</div>

> [!IMPORTANT]
> Hackathon entry for the **TxODDS World Cup 2026 → Consumer & Fan Experiences** track. Devnet only, fictitious tokens — no real money moves. Not affiliated with FIFA; no official marks are used.

<div align="center">
  <!-- still capture — for extra punch, swap for a 3–5s GIF loop of the arena taking a goal (during → after) -->
  <img src="docs/media/hero-demo.jpeg" alt="Hatrick live arena demo" width="760">
</div>

<p align="center">
  <strong>104</strong> matches · <strong>1</strong> TxLINE feed · <strong>2</strong> modes · <strong>2 states</strong> per event (during / after)
</p>

> [!TIP]
> **For judges — try it in ~60s:**
> 1. Open [hatrick.xyz](https://hatrick.xyz). In a restricted region? Append `?geo=demo` to unblock the betting surfaces.
> 2. Sign in with just an **email** — a Solana embedded wallet is created for you, invisibly (Privy). Phantom also works.
> 3. Confirm the **18+** gate, tap **Get test funds** (mints test USDC on devnet), and buy the starter pack.
> 4. Build your XI → run a 1v1 duel, or stay on the home and place an in-match bet on the live game.

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About the Project</a>
      <ul>
        <li><a href="#problem">Problem</a></li>
        <li><a href="#the-two-modes">The Two Modes</a></li>
        <li><a href="#fan-journey">The Fan Journey</a></li>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li><a href="#features">Features</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#architecture">Data &amp; Architecture — powered by TxLINE</a></li>
    <li><a href="#track-fit">Track Fit — Consumer &amp; Fan Experiences</a></li>
    <li><a href="#apps">Apps</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#compliance">Compliance</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#team">Team &amp; Contributors</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

## About the Project

<div id="about-the-project"></div>

**Hatrick** treats the World Cup as what it really is — a universe of live data — and builds one place to *play it* and *watch + bet it*. Two modes share one profile, one wallet, and one design, all fed by the same TxLINE feed.

### Problem

<div id="problem"></div>

Most fans watch with a phone in hand and a fragmented setup: score in one tab, fantasy in a separate app, odds in yet another. The data exists — TxLINE streams scores, events, and odds for all 104 matches — but the unified experience hasn't been built. Hatrick is that experience.

### The Two Modes

<div id="the-two-modes"></div>

- **🎮 Fantasy** — open packs, build your XI, and stake in **simulated 1v1 arena duels**.
- **📺 Live** — real matches as a **2D real-time arena** with live odds and in-match betting on one screen.
- **🗣️ Crowd layer** — chat + curated posts become comic-style **speech balloons** over the stands.

> The defining mechanic: every event is emitted in **two states** — `during` (optimistic, animates instantly) and `after` (confirmed by TxLINE, authoritative). See [Architecture](#architecture).

### The Fan Journey

<div id="fan-journey"></div>

One profile, one wallet ledger, two loops that feed each other:

```mermaid
flowchart LR
    A([Fan arrives]) --> B{18+ age gate}
    B -->|confirm| C[Sign in with Solana wallet]
    C --> D{Pick a mode}

    subgraph LIVE [📺 Live — real matches]
        E[Watch the 2D arena<br/>shaped by TxLINE events] --> F[Odds move in real time]
        F --> G[Place a bet<br/>during the match]
        G --> H[Settled on confirmed<br/>*.after events]
    end

    subgraph FANTASY [🎮 Fantasy — simulated duels]
        I[Open sticker packs] --> J[Build your XI]
        J --> K[Challenge a friend<br/>to a 1v1 arena duel]
        K --> L[Attributes evolve with real<br/>tournament performance]
    end

    D --> E
    D --> I
    H --> M[(Shared wallet ledger)]
    L --> M
    M --> N[Market: trade players,<br/>buy packs, bet again]
    N --> D
```

Winnings from Live fund Fantasy packs; a stronger XI makes duels worth betting on. Responsible-gaming controls (self-exclusion, stake limits) sit on top of the same ledger.

### Built With

<div id="built-with"></div>

[![TypeScript][ts-badge]][ts-url]
[![NestJS][nest-badge]][nest-url]
[![Next.js][next-badge]][next-url]
[![React][react-badge]][react-url]
[![Tailwind][tw-badge]][tw-url]
[![Solana][sol-badge]][sol-url]
[![Docker][docker-badge]][docker-url]

- **API:** NestJS · `@nestjs/event-emitter` (event-driven) · Socket.IO · Axios
- **Front:** Next.js (App Router) · shadcn/ui · Zustand · React Query · Solana Wallet Adapter · custom canvas game engine (framework-free TS)
- **Data:** TxLINE (SSE scores + odds, REST snapshots, oracle-signed settlement inputs) — see [Data & Architecture](#architecture)
- **Chain:** Solana (devnet) · Anchor programs for betting, fantasy duels, packs, and provably-fair seeds
- **Infra:** Docker (Postgres + Redis) · GitHub Actions CI

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

## Features

<div id="features"></div>

> 📸 Screenshots are placeholders — drop the real captures into [`docs/media/`](docs) (path noted in each block) and they render automatically.

<!-- FEATURE: Sticker packs / collection -->
<table>
  <tr>
    <td width="46%" valign="top">
      <img src="docs/media/feature-packs.png" alt="Opening a sticker pack" width="100%">
    </td>
    <td width="54%" valign="top">
      <h3>🃏 Sticker packs → your cards</h3>
      <p>Open packs to reveal player stickers with <strong>fixed ratings</strong>, a country, and a rarity. Each card is minted as a <strong>Metaplex Core NFT on Solana devnet</strong> — serial-numbered, capped supply, provably-fair pull — so your collection lives in your own wallet.</p>
      <ul>
        <li>Attributes are locked at open time (never change).</li>
        <li>Cards feed the <strong>Fantasy 1v1</strong> — not the live matches.</li>
        <li>Country is recorded for future country-based mechanics.</li>
      </ul>
    </td>
  </tr>
</table>

<!-- FEATURE: Fantasy 1v1 duel -->
<table>
  <tr>
    <td width="54%" valign="top">
      <h3>⚔️ Fantasy 1v1 duels</h3>
      <p>Build your XI from the cards you own and stake in a <strong>simulated 1v1 arena duel</strong> rendered by the custom canvas engine. Card ratings seed the sim (e.g. 95 vs 80 ≈ 86% edge).</p>
      <ul>
        <li>Challenge a friend or get matched.</li>
        <li>Wager settles to the winner; result is provable.</li>
      </ul>
    </td>
    <td width="46%" valign="top">
      <img src="docs/media/feature-fantasy-duel.jpeg" alt="Fantasy 1v1 duels — arena" width="100%">
    </td>
  </tr>
</table>

<!-- FEATURE: Live mode + betting -->
<table>
  <tr>
    <td width="46%" valign="top">
      <img src="docs/media/feature-live.jpeg" alt="Live 2D arena with odds" width="100%">
    </td>
    <td width="54%" valign="top">
      <h3>📺 Live mode + in-match betting</h3>
      <p>Follow real matches as a <strong>2D real-time arena</strong> shaped by the TxLINE feed, with live odds and in-match bets settled by the <strong>authoritative</strong> result.</p>
      <ul>
        <li>Optimistic <code>during</code> animation, confirmed <code>after</code> settlement.</li>
        <li>1X2 / Over-Under markets from the real odds feed.</li>
      </ul>
    </td>
  </tr>
</table>

<!-- FEATURE: Rooms -->
<table>
  <tr>
    <td width="54%" valign="top">
      <h3>👥 Watch-together rooms</h3>
      <p>Invite-only <strong>rooms</strong> to watch a match with friends — shared chat, social picks, and a match backdrop driven by the same feed.</p>
    </td>
    <td width="46%" valign="top">
      <img src="docs/media/feature-rooms.jpeg" alt="Watch-together room" width="100%">
    </td>
  </tr>
</table>

<!-- FEATURE: Crowd + HatBot -->
<table>
  <tr>
    <td width="46%" valign="top">
      <img src="docs/media/feature-crowd.png" alt="Crowd speech balloons and HatBot" width="100%">
    </td>
    <td width="54%" valign="top">
      <h3>🗣️ Crowd &amp; HatBot</h3>
      <p>Match moments become comic-style <strong>speech balloons</strong> over the stands. <strong>HatBot</strong> narrates the big beats (goals, reds, penalties, VAR) — a nicely-formatted feed of real events, by design not AI.</p>
    </td>
  </tr>
</table>

<!-- FEATURE: Store + wallet -->
<table>
  <tr>
    <td width="54%" valign="top">
      <h3>🛒 Team store &amp; wallet</h3>
      <p>A themed <strong>store</strong> for packs and cards, and one <strong>wallet</strong> shared across both modes. Sign in with just an email — a Solana embedded wallet is created invisibly (Privy) — or connect Phantom.</p>
      <ul>
        <li>Wager balance shown as a stablecoin ticker (devnet).</li>
        <li>Betting gated to wallet accounts; compliance built in (18+, geo, self-exclusion).</li>
      </ul>
    </td>
    <td width="46%" valign="top">
      <img src="docs/media/feature-store.png" alt="Team store and wallet" width="100%">
    </td>
  </tr>
</table>

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

## Getting Started

<div id="getting-started"></div>

A **polyglot monorepo of independent apps** — nothing shared, no cross-app imports. Run each app on its own.

### Prerequisites

<div id="prerequisites"></div>

- Node.js 20+
- Docker (for Postgres + Redis)
- (optional) A Solana wallet such as Phantom — email sign-in works without one
- Rust, Solana CLI 2.2.16, and Anchor 0.31.1 when building or deploying `contracts/`

### Installation

<div id="installation"></div>

```bash
# 1) API + infra (run from project/)
cd api
docker compose up -d                  # postgres :5432 + redis :6379
npm install                           # postinstall runs `prisma generate`
cp .env.example .env                   # set TXLINE_* to ingest live data
npm run prisma:deploy                  # apply migrations to a fresh DB
npm run start:dev                      # http://localhost:3001/health

# 2) Front (separate terminal)
cd front
npm install
cp .env.example .env.local
npm run dev                            # http://localhost:3000

# 3) Contracts (only when deploying or testing on-chain mode)
cd ../contracts
yarn install
anchor build --release
yarn test                              # local validator-backed Anchor tests
```

> The API boots cleanly with `TXLINE_ENABLED=false` and `SOLANA_ENABLED=false` (no credentials needed). See [`api/README.md`](api/README.md) for TxLINE and chain setup, and [`contracts/README.md`](contracts/README.md) for Anchor build/deploy instructions.

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

## Data & Architecture — powered by TxLINE

<div id="architecture"></div>

Everything you see in Hatrick originates from **[TxLINE](https://txline.txodds.com)**, TxODDS' real-time World Cup data product. There is no scraped or invented match data: one feed, one ingest path, many consumers.

### Where the data comes from

| Source | What it carries | How we use it |
|---|---|---|
| **TxLINE SSE — scores** | Live match events (goals, cards, corners, possession…) with a `confirmed` flag | The heartbeat of the whole app |
| **TxLINE SSE — odds** | Real-time market prices | Odds boards + in-match betting markets |
| **TxLINE REST snapshots** | Fixtures, lineups, current state | Fixture pages, initial state on connect |
| **Solana devnet** | TxLINE token activation plus Hatrick Anchor programs for betting, fantasy duels, card packs, and provably-fair seeds | Access to the feed is provisioned on-chain; app flows can run in play-money mode or chain-authoritative mode |

### One feed, two states, many consumers

```
TxLINE SSE (scores + odds)
        ▼
[api] ingest → normalizer ──emits──►  *.during (confirmed=false → optimistic, animate now)
        │   in-memory state           *.after  (confirmed=true  → authoritative, settle & recompute)
        ▼
   EventEmitter2 ─► listeners (fantasy attributes · live markets · settlement)
        ▼
[api] WebSocket gateway ──► [front] one WS → Zustand stores → surfaces
```

The core contract: **every domain event fires twice**. `*.during` is the optimistic read (TxLINE `confirmed=false`) — it drives instant animation. `*.after` is the authoritative read (`confirmed=true`) — it settles bets, recomputes fantasy attributes, and locks the score. The UI feels instant *and* trustworthy because those are two different events, not one guess.

<div align="center">
  <!-- replace with: docs/media/during-after.png — the same moment twice: optimistic pick vs confirmed settlement -->
  <img src="https://placehold.co/820x300/0b0b0b/14F195?text=during%20(optimistic)%20%E2%86%92%20after%20(confirmed)" alt="during vs after — optimistic animation, then authoritative settlement" width="820">
</div>

### What the feed drives on screen

- **Live 2D arena** — a match director translates feed events (possession shifts, shots, goals, corners) into the simulated pitch in real time; the scoreboard is authoritative from `*.after`.
- **Betting** — markets and odds mirror the odds stream; settlement only ever happens on confirmed events and can be mirrored from the Anchor betting program when chain mode is enabled.
- **Fantasy attributes** — player cards get stronger or weaker based on real tournament performance, recalculated on `*.after`.
- **Hero backdrop** — the landing page itself is a live render driven by the same feed.
- **Replay** — `POST /replay` re-plays a finished match through the *same* during/after pipeline, so every surface can be demonstrated 1:1 without waiting for kickoff.

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

## Track Fit — Consumer & Fan Experiences

<div id="track-fit"></div>

How Hatrick answers each judging criterion of the track:

| Criterion | How Hatrick answers it |
|---|---|
| **Fan Accessibility & UX** | One platform instead of three tabs: watch, play, and bet share one profile, wallet, and design system. Two clear modes from a single home; built for a non-technical fan. |
| **Real-Time Responsiveness** | The during/after contract makes latency a feature: the arena animates the instant an event arrives (`*.during`) and reconciles when TxLINE confirms it (`*.after`). One SSE ingest → WebSocket fan-out to every surface. |
| **Originality & Value Creation** | Not another picks leaderboard or pundit bot — a **playable match simulation** driven by real data. Live matches become a 2D arena; fantasy cards get stronger from real performances; both are the same engine fed by the same feed. |
| **Commercial & Monetization Path** | A closed economy with real monetization hooks: betting margin (Live), pack sales and market fees (Fantasy), and a wallet ledger connecting them. Responsible gaming built in (18+ gate, self-exclusion, stake limits) — table stakes for anything odds-adjacent. |
| **Completeness & Execution** | Functional end-to-end today: on-chain TxLINE token activation, four Anchor programs, live ingest, betting with settlement, pack → XI → 1v1 duels, replay for demos. Devnet, no real money. |

And the hard requirements: **TxLINE as live input** ✅ · **Solana sign-up** ✅ (wallet = Competitor account) · **functional product, not a mockup** ✅ · public repo + ≤5-min demo video with the submission.

### Real vs simulated — an honest scope

We'd rather show the seams than oversell. What's genuinely live/on-chain today, and what's simulated for the demo:

| ✅ Real (live / on-chain capable) | 🎭 Simulated (for the demo) |
|---|---|
| TxLINE SSE ingest — scores + odds | Crowd speech balloons & social picks |
| On-chain TxLINE token activation (devnet) | — |
| Fantasy 1v1 vs real users (direct challenge + ranked queue, CPU fallback) | — |
| Anchor programs for betting escrow, fantasy duel escrow, card packs, and provably-fair seeds | — |
| Betting markets + settlement from `*.after` | — |
| Match **replay** through the real pipeline | — |

> 🔗 **Proof it's on-chain:** program ids, deploy commands, and verification steps live in [`contracts/README.md`](contracts/README.md) — and every pack buy, bet, and settlement in the app links straight to Solscan (devnet).

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

## Apps

<div id="apps"></div>

| App | Stack | Port | Status |
|---|---|---|---|
| [`api/`](api) | NestJS, event-driven (TxLINE → DURING/AFTER → WebSocket) | 3001 | active |
| [`front/`](front) | Next.js (App Router) + shadcn/ui + Zustand + React Query | 3000 | active |
| [`contracts/`](contracts) | Anchor / Solana (devnet): betting, fantasy, packs, provably-fair seeds | — | active |

```text
project/
├─ api/        # NestJS — event-driven, TxLINE ingest, WS gateway (+ docker-compose)
├─ front/      # Next.js — shadcn, Zustand, React Query, services/
└─ contracts/  # Anchor / Solana — betting, fantasy duels, packs, provably-fair seeds
```

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

## Roadmap

<div id="roadmap"></div>

- [x] Monorepo scaffold (api + front), governance docs, CI, Docker infra
- [x] Event-driven core with the `during` / `after` contract
- [x] **TxLINE integration** — on-chain token activation, SSE ingest, snapshots, match **replay** through the live pipeline
- [x] **Live Mode** — feed-driven 2D arena, live odds board, markets, in-match betting + settlement
- [x] **Fantasy Mode** — packs, XI builder, dynamic attributes, 1v1 arena duels
- [x] Responsible gaming — 18+ age gate, self-exclusion, stake limits
- [x] Geo-blocking on betting surfaces (`proxy.ts`, `?geo=demo` bypass)
- [x] **Contracts** — Anchor programs for betting escrow, fantasy duel escrow, card packs, and provably-fair seeds
- [x] **Public deploy** — live at [hatrick.xyz](https://hatrick.xyz) + demo video with the submission
- [x] On-chain proof — Solscan receipts for pack buys, bets, and settlements (devnet)
- [ ] **Crowd** — chat + X balloons with moderation & ranking (front-simulated for the demo)

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

## Compliance

<div id="compliance"></div>

- **No FIFA IP** — no official branding, logos, marks, or implied affiliation.
- **Devnet only** — fictitious tokens; no real-money movement during the hackathon.
- **Geo-blocking** — betting surfaces restrict regulated jurisdictions.
- **Natural-person authorship** — AI used as a tool; a human team owns the submission.

Devnet only — fictitious tokens; no real money moves during the hackathon.

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

## License

<div id="license"></div>

Distributed under the **MIT License**. See `LICENSE.txt` for details once the license file is added to the repository.

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

## Team & Contributors

<div id="team"></div>

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Kc1t">
        <img src="https://github.com/Kc1t.png" width="110" height="110" alt="Kauã Miguel" style="border-radius:50%"><br />
        <sub><b>Kauã Miguel</b></sub>
      </a><br />
      <sub>Owner · <a href="https://github.com/Kc1t">@Kc1t</a></sub>
    </td>
    <td align="center">
      <a href="https://github.com/eudehh">
        <img src="https://github.com/eudehh.png" width="110" height="110" alt="Deborah Pavanelli Colicchio" style="border-radius:50%"><br />
        <sub><b>Deborah Pavanelli Colicchio</b></sub>
      </a><br />
      <sub>Member · <a href="https://github.com/eudehh">@eudehh</a></sub>
    </td>
    <td align="center">
      <a href="https://github.com/opedrooz">
        <img src="https://github.com/opedrooz.png" width="110" height="110" alt="Pedro H." style="border-radius:50%"><br />
        <sub><b>Pedro H.</b></sub>
      </a><br />
      <sub>Member · <a href="https://github.com/opedrooz">@opedrooz</a></sub>
    </td>
  </tr>
</table>

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

## Contact

<div id="contact"></div>

Team Hatrick · X: [@playhatrick](https://x.com/playhatrick) · Repository: [https://github.com/project-hattrick/hat-trick](https://github.com/project-hattrick/hat-trick)

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

<!-- BADGE LINKS -->
[ts-badge]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[ts-url]: https://www.typescriptlang.org/
[nest-badge]: https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white
[nest-url]: https://nestjs.com/
[next-badge]: https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[next-url]: https://nextjs.org/
[react-badge]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[react-url]: https://react.dev/
[tw-badge]: https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white
[tw-url]: https://tailwindcss.com/
[sol-badge]: https://img.shields.io/badge/Solana-14F195?style=for-the-badge&logo=solana&logoColor=black
[sol-url]: https://solana.com/
[docker-badge]: https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[docker-url]: https://www.docker.com/
