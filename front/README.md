# hat-trick / front — Next.js (App Router)

Next 16 · React 19 · Tailwind v4 · shadcn/ui + Zustand + React Query + a `services/` layer + Solana wallet login (devnet).

The consumer web app for both modes — **Fantasy** (pack → XI → simulated 1v1) and **Live** (real-time match view + betting) — over a shared profile/wallet/design. MVP user flows are built and **front-mocked** (backend adiado): the betting loop + settlement, the fantasy loop, market, fixtures, and profile all run off `config/` mocks + `services/mock/`, wired through the real stores.

## Run
```bash
npm install
cp .env.example .env.local   # point at the backend + pick the Solana cluster
npm run dev                  # http://localhost:3000
```
Scripts: `dev` · `build` · `start` · `lint` (no test script — verify by running the app).

## Routes (`src/app`)
| Route | Role |
|---|---|
| `/` | home / landing (live hero backdrop, LiveScorebar seam) |
| `/live` | 2D real-time match view + betting |
| `/duelists` · `/duelists/[username]` | duelist directory + public profiles (⌘K search) |
| `/duel/[id]` | 1v1 duel (reuses the game stage) |
| `/fantasy` · `/fantasy/market` | fantasy loop · player market |
| `/bets` · `/fixtures` · `/store` | bet slip/history · fixtures · store |
| `/profile` · `/profile/edit` | profile + XI · editor |
| `/about` · `/contact` · `/faq` · `/blog` · `/blog/[slug]` | marketing + MDX blog |
| `/legal/{privacy,terms,cookies,responsible-gaming,geo-restricted}` | compliance pages |
| `/style-guide` | living design-system reference |
| `/sandbox` (+ `?cp=`) | game-engine checkpoint runner + editor tools (see below) |

Metadata routes: `manifest.ts`, `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`.

**Geo-compliance** — `src/proxy.ts` (Next 16 middleware) blocks betting surfaces (`/live`, `/bets`, `/fixtures`) for restricted jurisdictions (`config/geo-restrictions.config.ts`, e.g. `BR`), using edge geo headers (`x-vercel-ip-country` / `cf-ipcountry`). Blocked visitors are rewritten to `/legal/geo-restricted`. **Demo bypass for judges:** append `?geo=demo` once (sets the `ht_geo_bypass` cookie for 24h). Unknown country (local dev) never blocks.

## Layout (`src/`)
| Folder | Role |
|---|---|
| `app/` | routes above + `globals.css`, `mdx-components.tsx` |
| `components/ui/` | shadcn primitives |
| `components/common/` | shared widgets (header, wallet button, icons barrel, GlassPanel) |
| `components/{home,live,duel,duelists,fantasy,market,profile,store,crowd,onboarding,legal,contact,game,aligner,design-system}/` | per-feature UI |
| `config/` | mock data + typed lookup configs (home, faq, duelists, formation, betting-markets, pack-pool, …) |
| `services/` | API callers (`*.service.ts`) · `services/mock/` · `services/queries/` React Query hooks (+ `keys.ts`) · `services/realtime/` (`socket.ts`, `use-live-feed.ts`) |
| `store/` | Zustand slices (see below) |
| `providers/` | `app-providers.tsx` — React Query + Solana wallet tree |
| `hooks/` | `use-zod-form.ts`, `use-landing-ready.ts` |
| `enums/`, `lib/`, `types/` | enums (barrel) · utils (env, query-client, solana, seo, blog, format, lookup, …) · shared types |
| `game/` | the framework-free 2D/2.5D match engine (see below) |

## Stores (`src/store/*.store.ts`)
`auth` · `wallet` (single ledger — bets/fantasy settle through it) · `bets` · `market` · `fantasy` · `duel` · `friends` · `match` · `crowd` · `prediction` · `notifications` · `onboarding` · `profile` · `home-entry` · `real-gk` · `sandbox` · `ui`. Stores map 1:1 with services; subscribe by selector, never the whole store.

## Game engine (`src/game`)
Custom **canvas/TS engine, framework-free** (no Three.js). `engine.ts` + `core/` `math/` `sim/` `render/`, plus `realgk/` for the real-match variant.

- **Checkpoints** — `checkpoints/registry.ts` registers self-contained scenes (`chuva-v1`, `arena-v1`, `effects-lab`, `real-gk-v2…v6`, `real-gk-play/solo/match/personas/persona-play`). `DEFAULT_CHECKPOINT = ChuvaV1`; `HERO_CHECKPOINT = RealGkMatch` plays live behind the home hero.
- **Sandbox** — `/sandbox?cp=<id>` renders any checkpoint via `GameStage`; sub-tools: `personas`, `personas-idle`, `player-heads`, `svg-players`, `hero-figures`, `markers`, `field-calibrator`, `sprite-editor`, `shadow-editor`, `billboard-editor`.
- **Assets** — `public/game/` (`actors/`, `ball/`, `personas/`, `player-align/`, `real-gk/`, `stadiums/`). Persona line-players = headless body + composed persona head (gated behind `features.personaHeads`).

## Engineering rules (non-negotiable)
| Rule | How it lives in the code |
|---|---|
| No `switch`/`case` | Typed lookup maps `Record<Enum, Config>` in `src/config/*`, read via `lookup()` from `src/lib/lookup.ts`. Branching is data. |
| No `fetch`/`axios` in components | All network access lives in `src/services/` (+ `queries/`, `realtime/`, `mock/`). |
| React Query + smart invalidation | Central key factory `services/queries/keys.ts`; mutations invalidate precise keys only. |
| Zustand for state | Client/UI/realtime state in `src/store/*.store.ts`; subscribe by selector. |
| React Hook Form for forms | `react-hook-form` + `zod` via `src/hooks/use-zod-form.ts`. |
| Avoid `useState`/`useEffect` | Form state → RHF; shared/UI state → Zustand; derived values in render. Sanctioned effects: the data-subscription hook and the game loop. |
| No multi-line comments | Single-line `//` or one-line `/** */` only. |
| Reusable fns → `src/lib/*` | Imported, never re-inlined. |
| ≤ 600 lines/file | Widgets ~≤120 lines; orchestrators only compose. |
| Icons | Phosphor duotone, imported **only** from the `components/common/icons` barrel. |
| English only · no tests this sprint | — |

## Design system — Neon Turf (dark-only)
Tokens live in `src/app/globals.css` (Tailwind v4, CSS-first — no `tailwind.config`): neutral graphite surfaces + lime-neon accent, semantic type scale (`.text-display/title/eyebrow/micro`), pitch-turf utilities, the glass-black surface (use the `GlassPanel` component, never copy-pasted classes), hero accent glow + seam utilities. The theme switcher/color palettes were removed — the Neon Turf baseline is the only theme. Living reference at `/style-guide`; formal docs in `docs/design-system.md`.

## Key deps
`next` 16 · `react` 19 · Tailwind v4 · `shadcn` · `@base-ui/react` · `@phosphor-icons/react` · `zustand` · `@tanstack/react-query` · `react-hook-form` + `zod` · `socket.io-client` · `@solana/wallet-adapter-*` (sign-in only) · `@next/mdx` + `remark-*` (blog) · `lenis` (smooth scroll) · `sonner`, `flag-icons`, `next-themes`.
