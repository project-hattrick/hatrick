<a id="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/your-org/hat-trick">
    <img src="front/public/logo.png" alt="Hat-trick" width="96" />
  </a>

  <h1 align="center">Hat-trick</h1>

  <p align="center">
    One platform, two ways to live the 2026 World Cup — a 3D fantasy and a live 2D match view, both powered by the <strong>TxLINE</strong> real-time feed on <strong>Solana</strong>.
    <br />
    <a href="#" target="_blank">View Design System</a>
    ·
    <a href="https://github.com/your-org/hat-trick/issues" target="_blank">Report Bug</a>
    ·
    <a href="https://github.com/your-org/hat-trick/issues" target="_blank">Request Feature</a>
  </p>

  <p align="center">
    <a href="https://your-deploy-url.example" target="_blank"><strong>🌐 Live demo (placeholder) »</strong></a>
  </p>

  <p align="center">
    <a href="https://github.com/your-org/hat-trick/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/your-org/hat-trick/ci.yml?branch=main&label=ci&style=flat-square"></a>
    <img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square">
    <img alt="Solana" src="https://img.shields.io/badge/Solana-devnet-14F195?style=flat-square">
    <img alt="Powered by TxLINE" src="https://img.shields.io/badge/powered%20by-TxLINE-orange?style=flat-square">
    <img alt="Hackathon" src="https://img.shields.io/badge/TxODDS%20World%20Cup-2026-black?style=flat-square">
  </p>
</div>

> [!IMPORTANT]
> Hackathon entry for the **TxODDS World Cup 2026 → Consumer & Fan Experiences** track. Devnet only, fictitious tokens — no real money moves. Not affiliated with FIFA; no official marks are used.

<div align="center">
  <img src="https://placehold.co/760x400/0b0b0b/14F195?text=Hat-trick+preview" alt="Hat-trick preview (placeholder)" width="760">
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About the Project</a>
      <ul>
        <li><a href="#problem">Problem</a></li>
        <li><a href="#the-two-modes">The Two Modes</a></li>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#architecture">Architecture</a></li>
    <li><a href="#apps">Apps</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#compliance">Compliance</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#team">Team &amp; Contributors</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

## About the Project

<div id="about-the-project"></div>

**Hat-trick** treats the World Cup as what it really is — a universe of live data — and builds one place to *play it* and *watch + bet it*. Two modes share one profile, one wallet, and one design, all fed by the same TxLINE feed.

### Problem

<div id="problem"></div>

Most fans watch with a phone in hand and a fragmented setup: score in one tab, fantasy in a separate app, odds in yet another. The data exists — TxLINE streams scores, events, and odds for all 104 matches — but the unified experience hasn't been built. Hat-trick is that experience.

### The Two Modes

<div id="the-two-modes"></div>

- **🎮 Fantasy** — open sticker packs, build your XI, and face other users in **3D simulated matches** where player attributes are driven by real tournament performance via TxLINE.
- **📺 Live** — follow real matches as a **2D real-time abstraction** built from the TxLINE SSE feed, with live odds and in-match betting on one screen.
- **🗣️ Crowd layer** — internal chat + curated X posts become comic-style **speech balloons** over the stands, timed to the latest match event.

> The defining mechanic: every event is emitted in **two states** — `during` (optimistic, animates instantly) and `after` (confirmed by TxLINE, authoritative). See [Architecture](#architecture).

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
- **Front:** Next.js (App Router) · shadcn/ui · Zustand · React Query · Solana Wallet Adapter · Three.js *(planned)*
- **Data:** TxLINE (SSE scores + odds, snapshots, Merkle proofs)
- **Chain:** Solana (devnet) · Anchor *(Phase 2)*
- **Infra:** Docker (Postgres + Redis) · GitHub Actions CI

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

## Getting Started

<div id="getting-started"></div>

A **polyglot monorepo of independent apps** — nothing shared, no cross-app imports. Run each app on its own.

### Prerequisites

<div id="prerequisites"></div>

- Node.js 20+
- Docker (for Postgres + Redis)
- A Solana wallet (e.g. Phantom) for the front

### Installation

<div id="installation"></div>

```bash
# 1) API + infra (run from project/)
cd api
docker compose up -d                  # postgres :5432 + redis :6379
npm install
cp .env.example .env                   # set TXLINE_* to ingest live data
npm run start:dev                      # http://localhost:3001/health

# 2) Front (separate terminal)
cd front
npm install
cp .env.example .env.local
npm run dev                            # http://localhost:3000
```

> The API boots cleanly with `TXLINE_ENABLED=false` (no credentials needed). See [`api/README.md`](api/README.md) for TxLINE setup.

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

## Architecture

<div id="architecture"></div>

```
TxLINE SSE (scores + odds)
        ▼
[api] ingest → normalizer ──emits──►  *.during (confirmed=false → animate)
        │   in-memory state           *.after  (confirmed=true  → settle/recompute)
        ▼
   EventEmitter2 ─► listeners (fantasy attrs · live markets · crowd)
        ▼
[api] WebSocket gateway ──► [front] animate on .during, reconcile on .after
```

Every event fires as `*.during` (optimistic) then `*.after` (confirmed by TxLINE); the WS gateway broadcasts both to the front.

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

## Apps

<div id="apps"></div>

| App | Stack | Port | Status |
|---|---|---|---|
| [`api/`](api) | NestJS, event-driven (TxLINE → DURING/AFTER → WebSocket) | 3001 | active |
| [`front/`](front) | Next.js (App Router) + shadcn/ui + Zustand + React Query | 3000 | active |
| [`contracts/`](contracts) | Anchor / Solana (devnet) | — | ⏸ Phase 2 (deferred) |

```text
project/
├─ api/        # NestJS — event-driven, TxLINE ingest, WS gateway (+ docker-compose)
├─ front/      # Next.js — shadcn, Zustand, React Query, services/
└─ contracts/  # Anchor / Solana — ⏸ deferred (Phase 2)
```

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

## Roadmap

<div id="roadmap"></div>

- [x] Monorepo scaffold (api + front), governance docs, CI, Docker infra
- [x] Event-driven core with the `during` / `after` contract
- [ ] **Live Mode** — 2D field, live odds, markets, in-match betting UI
- [ ] **Fantasy Mode** — packs, dynamic attributes, 3D simulation, 1v1
- [ ] **Crowd** — chat + X balloons with moderation & ranking
- [ ] Geo-blocking, deploy, demo video
- [ ] *(Phase 2)* On-chain escrow + `validate_stat` settlement + Merkle-proof UI

Order: Live Mode first, then Fantasy, then Crowd; on-chain settlement is Phase 2.

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

## Compliance

<div id="compliance"></div>

- **No FIFA IP** — no official branding, logos, marks, or implied affiliation.
- **Devnet only** — fictitious tokens; no real-money movement during the hackathon.
- **Geo-blocking** — betting surfaces restrict regulated jurisdictions.
- **Natural-person authorship** — AI used as a tool; a human team owns the submission.

Devnet only — fictitious tokens; no real money moves during the hackathon.

<p align="right">(<a href="#readme-top">Back to top</a>)</p>

## Contributing

<div id="contributing"></div>

1. Open an issue describing the change.
2. Create a feature branch (`git checkout -b feat/your-feature`).
3. Follow the conventions: English · ≤600 lines/file · enums not strings · no cross-app imports · no tests this sprint (verify by running).
4. Open a focused PR with a short explanation and screenshots/GIFs for UI changes.

> CI builds both apps on every push/PR — see [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

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

Team Hat-trick · Repository: [https://github.com/your-org/hat-trick](https://github.com/your-org/hat-trick)

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
# hat-trick
