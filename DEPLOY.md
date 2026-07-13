# Deploy runbook — hat-trick

> Goal: a public link judges can open **during a real match**. Front on **Vercel**, api on
> **Fly.io** (Render works too — same Dockerfile), Postgres + Redis managed. Budget ~2h; the
> cross-domain cookie/CORS wiring is the part that bites. Do the api first (the front needs its URL).

## 0. The one gotcha that breaks everything

Front (`*.vercel.app`) and api (`*.fly.dev`) are **different registrable domains → cross-site**.
The `ht_session` cookie is `SameSite=Lax` by default, which the browser will **not** send
cross-site → every authed request 401s. Fix is already wired — you just set env:

- api: `SESSION_COOKIE_SAMESITE=none` (auto-forces `Secure`; HTTPS only — Fly/Vercel are HTTPS).
- api: `FRONT_ORIGIN=https://<your-front>.vercel.app` (exact origin; CORS allow-list, comma-sep for many).
- front: fetches already send `credentials: 'include'` (`services/http.ts`); the WS gateway is
  public (no cookie auth) so `NEXT_PUBLIC_WS_URL` just needs to point at the api.

## 1. API → Fly.io

```bash
cd project/api
fly launch --no-deploy            # pick app name; it writes over fly.toml's `app` — re-check region gru
fly postgres create               # note the DATABASE_URL it prints
# Redis: create an Upstash DB (fly ext redis create) and grab its redis:// URL
```

Set secrets (never commit these):

```bash
fly secrets set \
  DATABASE_URL="postgres://…" \
  REDIS_URL="redis://…" \
  JWT_SECRET="$(openssl rand -hex 32)" \
  JWT_EXPIRES_IN="7d" \
  FRONT_ORIGIN="https://<front>.vercel.app" \
  SESSION_COOKIE_SAMESITE="none" \
  TXLINE_ENABLED="true" \
  TXLINE_BASE_URL="https://txline-dev.txodds.com" \
  TXLINE_JWT="…" TXLINE_API_TOKEN="…"
fly deploy
```

- The container runs `prisma migrate deploy` on boot (idempotent), then `node dist/main`.
- `min_machines_running = 1` keeps the SSE ingest + WS alive through the demo — don't scale to 0.
- Solana stays off in prod unless you set `SOLANA_ENABLED=true` + keypairs (wallet **sign-in** on the
  front needs none of this; on-chain settlement is Phase 2).

## 2. Front → Vercel

- Import `project/front` as the Vercel project root. `.npmrc` (`legacy-peer-deps=true`) makes the
  React-19 / wallet-adapter install succeed — without it the build fails on peer conflicts.
- Set **Environment Variables** (Production) — these are inlined at build time, so **redeploy after any change**:

  | Var | Value |
  |---|---|
  | `NEXT_PUBLIC_API_URL` | `https://<api>.fly.dev` |
  | `NEXT_PUBLIC_WS_URL` | `https://<api>.fly.dev` |
  | `NEXT_PUBLIC_USE_MOCK` | `false` |
  | `NEXT_PUBLIC_SOLANA_CLUSTER` | `devnet` |
  | `NEXT_PUBLIC_HAT_TRICK_PROGRAM_ID` | (from `.env.example`) |

## 3. Smoke test (do this before recording)

1. Open the Vercel URL → age gate → wallet sign-in (Phantom) completes and **survives a reload**
   (proves the cross-site cookie is set + sent). If it re-prompts, `SESSION_COOKIE_SAMESITE` isn't `none`.
2. `/fixtures` lists real TxLINE fixtures (proves api ↔ TxLINE ↔ front).
3. Place a bet on a live/replay fixture → the arena animates (WS `match-event.*`) → it settles at FT.
4. Betting surfaces (`/live`, `/bets`, `/fixtures`) geo-block from BR; judges outside BR are fine, or
   append `?geo=demo` to bypass (24h cookie) — **mention this in the submission doc**.
5. `fly logs` shows the SSE subscribe window + `*.after` events; no CORS errors in the browser console.

## Render alternative (if Fly is fussy)

New **Web Service** → Docker → root `project/api` → it uses the same `Dockerfile`. Add a Render
Postgres + Redis, set the same env vars in the dashboard. Health check path `/health`.
