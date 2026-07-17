# Architecture — event-driven core (DURING / AFTER)

> How real-time data flows from TxLINE to the UI. The whole backend is built around **`@nestjs/event-emitter`** and a **two-state emission contract**.

## The flow
```
TxLINE SSE (scores + odds)
        │  fetch() stream, reconnect+resume (Last-Event-ID)
        ▼
[api] TxlineIngestService  ── normalizes raw SSE ──►  TxlineNormalizer
        │                                                   │ emits typed domain events on EventEmitter2
        │  keeps in-memory TournamentState                  ▼
        │  (scores, odds, stats, lineups)        ┌── *.during  (confirmed=false, optimistic)
        │                                         └── *.after   (confirmed=true,  authoritative)
        ▼                                                   │
   listeners: AttributeEngine (Fantasy) · MarketProjector (Live) ·
              CrowdPipeline · (Phase 2) SettlementKeeper
        │
        ▼
[api] RealtimeGateway (WebSocket)  ── broadcasts both states ──►  [front]
                                                                     animate on .during
                                                                     reconcile on .after
```

## The two-state contract (the core rule)
Every domain event is emitted **twice** over its lifetime:

| State | Trigger | Purpose | Example names |
|---|---|---|---|
| `*.during` | TxLINE event with `confirmed=false` (or our optimistic projection) | instant UI / animation; may be revised | `GoalDuring`, `RedCardDuring`, `SubstitutionDuring` |
| `*.after` | TxLINE event with `confirmed=true` | authoritative; settlement, attribute recalculation, stat persistence | `GoalAfter`, `RedCardAfter`, `MatchEndAfter` |

- The mapping hinges on the score event's **`confirmed`** boolean (see [`txline-provider.md`](txline-provider.md)).
- The frontend treats `.during` as provisional (animate, show, allow rollback) and `.after` as final (lock score, settle UI, recompute).
- **All event names are enums** (`events/enums`), never string literals. Payloads are typed DTOs (`events/dto`).

## Backend modules (`project/api/src`)
| Module | Responsibility |
|---|---|
| `txline/` | SSE ingest + auth (guest JWT + API token), reconnection/resume, in-memory `TournamentState`, REST snapshot wrappers, **normalizer that emits `*.during` / `*.after`** |
| `events/` | shared **enums** (event names, actions, market types, game states) + typed **DTOs** (event payloads) |
| `realtime/` | WebSocket gateway; re-broadcasts both states to the front; pushes current snapshot on connect |
| `fantasy/` | attribute engine (listens to `*.after`), packs, internal market, server-side match simulation orchestration |
| `live/` | market/odds projection from the odds stream, in-match bet intake |
| `crowd/` | chat + X intake, moderation, contextual ranker, cadenced balloon stream (≤1 new balloon / 2s / stand) |
| `settlement/` | ⏸ **Phase 2** — keeper bot, proof building, contract CPI |
| `common/` | config, logging, base enums/utilities |

## Why event-driven
- One feed, two consumers (Fantasy attributes **and** Live view) get the **same event at the same time** → consistency.
- New listeners (crowd, narration, analytics) attach without touching the ingest path.
- The DURING/AFTER split is what makes the UI feel instant **and** trustworthy: animate immediately, reconcile when confirmed.

## Frontend consumption
- One WS connection (`services/realtime`) fans events into **Zustand** stores (`matchStore`, `fantasyStore`, `crowdStore`).
- React Query handles REST (fixtures, snapshots, history, bet mutations).
- Components subscribe to store slices; `.during` drives animation state, `.after` commits final state.
