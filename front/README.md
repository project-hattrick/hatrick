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

## Engineering rules (non-negotiable)

| Rule | How it lives in the code |
|---|---|
| No `switch`/`case` | Typed lookup maps `Record<Enum, Config>` in `src/config/*.config.ts`, read via `lookup()` from `src/lib/lookup.ts`. Branching is data, not control flow. |
| No multi-line comments | Single-line `//` or one-line `/** */` only. Convention-enforced. |
| Reusable fns → utils | Every reusable pure function lives in `src/lib/*` (`format.ts`, `lookup.ts`, `cn`) and is imported, never re-inlined. |
| ≤ 600 lines/file | Decompose: widgets ~≤120 lines, orchestrators only compose. |
| React Query + smart invalidation | Central key factory `src/services/queries/keys.ts`; mutations invalidate precise keys only. All network access stays in `src/services/`. |
| Zustand for state | Client/UI/realtime state in `src/store/*.store.ts`; subscribe by selector, never the whole store. |
| React Hook Form for forms | `react-hook-form` + `zod` via `src/hooks/use-zod-form.ts`. |
| Avoid `useState`/`useEffect` | Form state → RHF; shared/UI state → Zustand; derived values computed in render. The only sanctioned effects are the data-subscription hook (`use-live-feed`) and the 2D/2.5D game loop in `match-stage`. |

## Design tokens

Dark-only. Brand palette + tokens live in `src/app/globals.css` (Tailwind v4, CSS-first — no `tailwind.config`): black-green stage `--background #0a0d0a`, lime-neon accent `--primary #aef019`, surfaces `--color-surface-1/2/3`, `--color-live` (coral), `--color-hot` (badge), `--color-pitch`, `--color-team-home/away`. The glass widget surface is the `GlassPanel` component, never copy-pasted classes.
