# hat-trick / front — Next.js (App Router)

shadcn/ui + Zustand + React Query + a `services/` layer + Solana wallet login (devnet).

## Run
```bash
npm install
cp .env.example .env.local   # point at the backend + pick the Solana cluster
npm run dev                  # http://localhost:3000
```

## Layout (`src/`)
| Folder | Role |
|---|---|
| `app/` | routes: `/` (mode-picker), `/live`, `/fantasy` |
| `components/ui/` | shadcn primitives · `components/common/` shared (header, wallet button, mode card) |
| `services/` | API callers (`*.service.ts`) · `services/queries/` React Query hooks · `services/realtime/` socket → stores |
| `store/` | Zustand slices (`match`, `fantasy`, `crowd`) |
| `providers/` | React Query + Solana wallet providers |
| `enums/`, `lib/` | enums · env, query client, solana endpoint |

## Conventions
shadcn + small components · Zustand (client state) + React Query (server state) · **no `fetch`/`axios` in components — always via `services/`** · enums not strings · ≤600 lines/file · no tests this sprint · English.

> Base seams with `TODO`s — generic and easy to swap. Three.js / 3D deferred until Fantasy work starts.
