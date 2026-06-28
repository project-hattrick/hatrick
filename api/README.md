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
| Folder | Role |
|---|---|
| `txline/` | SSE ingest + auth + in-memory `TournamentState` + REST snapshots + **normalizer** (emits `*.during`/`*.after`) |
| `events/` | `enums/` (event names, actions, markets, states) + `dto/` (typed payloads) |
| `realtime/` | WebSocket gateway broadcasting both states |
| `fantasy/` · `live/` · `crowd/` | listener seams (attribute engine, market projector, crowd pipeline) |

## Conventions
Event-driven only · enums not strings · ≤600 lines/file · no tests this sprint · English.

> These are **base seams** with `TODO`s — generic and easy to swap. Don't deep-implement features until scoped.
