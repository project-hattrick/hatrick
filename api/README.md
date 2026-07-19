# Hatrick — API (NestJS, event-driven)

TxLINE ingest → `@nestjs/event-emitter` (DURING/AFTER) → WebSocket gateway.

## Services (Postgres + Redis)
```bash
docker compose up -d   # postgres :5432 + redis :6379 (config in docker-compose.yml)
```

## Run
```bash
npm install
cp .env.example .env   # see "Configuration" section below
npm run start:dev
# health: GET http://localhost:3001/health
```
Boots cleanly with `TXLINE_ENABLED=false` and `SOLANA_ENABLED=false` (no creds needed).

## Layout (`src/`)
| Folder | Role | State |
|---|---|---|
| `txline/` | SSE **live ingest** (subscribe window, backoff, `Last-Event-ID` resume) + auth + **normalizer** (`*.during`/`*.after`) + historical **replay** + Redis-cached snapshots | done |
| `events/` | `enums/` (event names, actions, markets, states) + `dto/` (typed payloads) | done |
| `realtime/` | WebSocket gateway re-broadcasting both states + per-user notification channel | done |
| `auth/` · `users/` · `wallet/` | wallet + email/password sign-in (JWT cookie) · profiles/friends/notifications · ledger-backed wallet | done |
| `live/` | play-money betting + **authoritative settlement** on `match-end.after` + odds/market projection | done |
| `fantasy/` | packs · squad/XI · staked 1v1 duels (MMR) + TxLINE-driven card attributes | done |
| `market/` · `store/` · `room/` · `crowd/` | card trades · limited-stock store · invite-only rooms · crowd balloons | done |
| `chain/` | Solana faucet · unsigned bet-tx builder · settlement keeper (gated by `SOLANA_ENABLED`) | separate dev |
| `prisma/` · `common/` | schema + client · cache/DTOs/guards | done |

## Configuration

### TxLINE (Live Data Feed)
See `.env.example` — set `TXLINE_ENABLED=true`, `TXLINE_BASE_URL`, `TXLINE_JWT`, `TXLINE_API_TOKEN` to ingest real matches from the TxODDS stream.

### Solana / On-Chain (Betting, Duels, Packs, Seeds)

**Enable**: Set `SOLANA_ENABLED=true` in `.env`.

**Keypairs** (inline JSON array or file path):
```bash
SOLANA_MINT_AUTHORITY=[12,34,56,...]    # Mints play tokens
SOLANA_ORACLE=[12,34,56,...]             # Oracle signer for betting
SOLANA_LAYER=[12,34,56,...]              # Authority for duels, packs, seed oracle
```

**Program IDs** (devnet defaults; override after re-deploy):
```bash
HATTRICK_BETTING_PROGRAM_ID=GhGZEarksLDfSDHg98PKm2xZuHJjSE8Zujd9mBB8zqXc
HATTRICK_FANTASY_PROGRAM_ID=67QvSGTacjzuQFJujCREMWtRVonCLypqKmK2dszVdDwz
HATTRICK_PACKS_PROGRAM_ID=BtgAtofxN8RJxaC824XUeamCZL13b63u2YaVTvhVGfFo
HATTRICK_PROVABLY_FAIR_PROGRAM_ID=DsWff3P22AsnXAk7EthHNythzDWLc7bg5JS3aPpNjsLQ
```

**Mints**:
```bash
PLAY_TOKEN_MINT=         # Leave empty for dev (auto-create on first faucet)
USDC_MINT=               # For duel escrow (defaults to play token if unset)
```

See `.env.example` for all settings. Full on-chain architecture: [`docs/technical-documentation.md`](../docs/technical-documentation.md).

## Dual-Mode Architecture

- **Play-money mode** (`SOLANA_ENABLED=false`): Ledger-backed wallet in DB; settle via app logic. Development default.
- **On-chain mode** (`SOLANA_ENABLED=true`): Four Anchor programs handle escrow, settlement, and minting; DB mirrors state. Must deploy contracts first.

Both modes coexist; frontend/backend respect their flags independently.

## Conventions
Event-driven only · enums not strings · ≤600 lines/file · no tests this sprint · English.

> Honest scope — what's live vs simulated — is documented in [`docs/technical-documentation.md`](../docs/technical-documentation.md#12-honest-scope--real-vs-simulated).
