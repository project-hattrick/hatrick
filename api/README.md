# hat-trick / api — NestJS (event-driven)

TxLINE ingest → `@nestjs/event-emitter` (DURING/AFTER) → WebSocket gateway.

## Services (Postgres + Redis)
```bash
docker compose up -d   # postgres :5432 + redis :6379 (config in docker-compose.yml)
```

## Run
```bash
npm install
cp .env.example .env   # set TXLINE_* (+ DATABASE_URL / REDIS_URL); TXLINE_ENABLED=true to ingest live
npm run start:dev
# health: GET http://localhost:3001/health
```
Boots cleanly with `TXLINE_ENABLED=false` (no creds needed).

## Layout (`src/`)
| Folder | Role | State |
|---|---|---|
| `txline/` | SSE **live ingest** (subscribe window, backoff, `Last-Event-ID` resume) + auth + **normalizer** (`*.during`/`*.after`) + historical **replay** + Redis-cached snapshots | done |
| `events/` | `enums/` (event names, actions, markets, states) + `dto/` (typed payloads) | done |
| `realtime/` | WebSocket gateway re-broadcasting both states + per-user notification channel | done |
| `auth/` · `users/` · `wallet/` | wallet + email/password sign-in (JWT cookie) · profiles/friends/notifications · ledger-backed wallet | done |
| `live/` | play-money betting + **authoritative settlement** on `match-end.after` | done · *market-projector = stub* |
| `fantasy/` | packs · squad/XI · staked 1v1 duels (MMR) | done · *attribute-engine = stub* |
| `market/` · `store/` · `room/` · `crowd/` | card trades · limited-stock store · invite-only rooms · crowd balloons | done |
| `chain/` | Solana faucet · unsigned bet-tx builder · settlement keeper (gated by `SOLANA_ENABLED`) | separate dev |
| `prisma/` · `common/` | schema + client · cache/DTOs/guards | done |

## Conventions
Event-driven only · enums not strings · ≤600 lines/file · no tests this sprint · English.

> Two known backend stubs: `fantasy/services/attribute-engine.service.ts` (cards don't yet evolve from TxLINE stats) and `live/services/market-projector.service.ts` (odds not projected into extra markets). See [`../../docs/gaps.md`](../../docs/gaps.md).
