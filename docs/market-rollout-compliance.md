# Market Rollout & Compliance

> How Hatrick handles compliance as it rolls out region by region. **Principle: only the wagering
> surface is gated.** Watching the live match, collecting cards, building an XI, and playing fantasy
> duels stay open everywhere — only real-money-style betting is restricted where it isn't permitted.

## The gating model

Hatrick is one platform with several surfaces. We gate them independently so a fan in a restricted
region still gets most of the product:

| Surface | Restricted region | Open region |
|---|---|---|
| Watch live match (2D arena, play-by-play, scoreboard) | ✅ open | ✅ open |
| Odds board (view prices) | ✅ open (view-only) | ✅ open |
| **Place a bet / in-match wager** | ⛔ **geo-blocked** | ✅ open |
| Card packs, collection, build XI | ✅ open | ✅ open |
| Fantasy 1v1 duels | ✅ open | ✅ open |

Only `/live`, `/bets`, and the betting actions on `/fixtures` sit behind the geo-block; everything else
is always reachable.

## How the geo-block works

- IP-based region detection on the betting surfaces. Restricted jurisdictions (e.g. **Brazil**, per CMN
  Resolution 5.298/2026 on sports-event derivatives) return a blocked state instead of the bet slip.
- **Judge bypass:** appending `?geo=demo` to any URL sets a 24-hour cookie that lifts the block, so
  reviewers testing from a restricted region can evaluate the full flow. (This is a hackathon evaluation
  convenience on devnet play-money — not a production bypass.)

## Responsible gaming (everywhere, not just restricted regions)

- **18+ age gate** — blocking and non-dismissible on entry.
- **Self-exclusion** — a user can self-exclude in Settings; the choice gates both the UI and the API.
- **Stake limits** — configurable per-user limits, enforced on the server, not just the client.
- **Play-money only during the hackathon** — Solana **devnet** with fictitious test tokens (in-app
  faucet). No real money moves. A disclaimer sits in the footer.
- **Essential-only cookies** — no analytics/tracking gate.

## No FIFA IP

No official branding, logos, marks, or implied affiliation. Player and team **names** arrive as factual
TxLINE data (permissible to display); card art is stylized and does not depict real players — no
likeness. Fictional cards resolve by nation + shirt number + position, never by matching a real name.

## Expansion path

The same engine scales well beyond the World Cup: **TxODDS covers 350+ leagues across 30+ sports**, so
Hatrick can light up new competitions league-by-league — enabling the betting surface only where it is
licensed, while the watch-and-play surfaces open globally from day one.
