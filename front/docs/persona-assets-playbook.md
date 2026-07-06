# Persona assets — comparative playbook

Where the persona-cast match stands, per animation: **what body art it used before**, **what it uses now**, whether the
**persona head composites** correctly, and **which regen assets are still missing**.

Applies to the two persona checkpoints:
- `real-gk-personas` — **automated** match (hero script/bounds/lighting), `extraAnims: false`.
- `real-gk-persona-play` — **playable** sandbox, `extraAnims: true` (unlocks header/trap/turn/brake).

## Art-style legend

| Tag | Meaning | Head |
|---|---|---|
| **regen-v1** | New body-only regen pack (`*_bodyonly_regen_v1`) — the current target style | Headless → persona head composited |
| **v4** | Older v4 action bodies (`public/game/real-gk/`) | Headless → persona head composited |
| **2x2** | Legacy aligner 2x2 slices (pre-regen persona bodies) | Headless → persona head composited |
| **baked** | Whole sprite with a generic face painted in | ❌ Generic face — persona head ignored |

Head compositing only happens when the mode has a config entry (`LOCOMOTION_FRAME_CONFIG` or `OUTFIELD_FRAME_CONFIG`)
**and** a headless body. Anything **baked** shows the wrong (generic) face on a persona.

---

## 1. Locomotion (the bodies we swapped)

Source folder: `public/game/personas/players/`.

| Anim (`BodyAnim`) | Before | Now | Persona head | Regen available? |
|---|---|---|---|---|
| `idle_front` | 2x2 | **regen-v1** ✅ | ✅ | done |
| `walk_front` | 2x2 | **regen-v1** ✅ | ✅ | done |
| `run_front` | 2x2 | **regen-v1** ✅ | ✅ | done |
| `run_side` | 2x2 | **regen-v1** ✅ | ✅ | done |
| `walk_back` | 2x2 | **regen-v1** ✅ | ✅ | done |
| `shot_front` | — (new) | **regen-v1** ✅ | ✅ | done |
| `run_back` | 2x2 | **regen-v1** ✅ | ✅ | done (`run_back_bodyonly_regen_v1`) |
| `idle_back` | 2x2 | **regen-v1** ✅ | ✅ | done (`idle_back_bodyonly_regen_v1`) |

**Locomotion is fully regen now** (front + side + back family). Preview them at `/sandbox/personas-idle` (mode selector
includes Idle/Walk/Run · back).

---

## 2. Strike / actions

Bodies live in `public/game/real-gk/` (v4) unless noted. Actions marked *(play only)* only trigger when
`extraAnims` is on — i.e. in `real-gk-persona-play`, not in the automated match.

| Anim (`BodyAnim`) | Style | Persona head | Regen available? |
|---|---|---|---|
| **All persona strikes** (front / side / back) | **regen-v1** `shot_front` ✅ | ✅ | every persona shot now collapses to the regen body (`sim/shot.ts`, `personas=true`) |
| `power_shot` / `_back` / `side_shot` (v4 strikes) | v4 | ✅ | **only used by non-persona checkpoints now** — personas no longer reach them |
| ⚠️ Rear-view shot **pose** | reuses front `shot_front` | ✅ (front head) | **NO `shot_back` regen pack** — the back case plays the front body; generate a `shot_back` body-only pack for a true rear kick |
| `header` *(play only)* | v4 | ✅ | no `bodyonly_regen` pack (only `header_pack*`) |
| `receive_foot` (trap) *(play only)* | v4 | ✅ | no regen pack |
| `intercept` *(play only)* | v4 | ✅ | no regen pack |
| `turn_side` / `stop_brake` *(play only)* | v4 | ✅ | no regen pack |

**Gap:** everything except the front `shot_front` is still v4 art. Heads composite fine, but the **body style** is a
generation older than the regen locomotion, so a shot to the side or a trap won't match the new look.

---

## 3. Celebrations ← the "comemoração" gap

Used by `sim/celebration.ts` when `celebrations: true` (both persona checkpoints).

| Phase | Anim (`BodyAnim`) | Style | Persona head |
|---|---|---|---|
| Run / Pose / Loop | `player_armsup_run_front` (`ArmsUpRun`) | v4 | ✅ composited |
| Jump | `celebrate_jump` (`CelebrateJump`) | v4 | ✅ composited |
| Knee slide | `celebrate_knee_slide` (`KneeSlide`) | **baked** | ❌ **generic face** |
| Knee rise | `celebrate_knee_rise` (`KneeRise`) | **baked** | ❌ **generic face** |
| Knee jump | `celebrate_knee_jump` (`KneeJump`) | **baked** | ❌ **generic face** |

**Gap (visible on every goal):** the arms-up celebration keeps the persona head, but the **knee-slide sequence shows a
generic baked face**, breaking the illusion right at the celebration. No headless regen pack exists for the knee frames —
they'd need to be regenerated body-only (like the locomotion pack) to composite the persona head.

---

## 4. Goalkeeper

GK sprites (`gk_*`) are **baked** whole sprites and the renderer never persona-casts the keeper (`!isGk`). This is by
design (one keeper character). Codex has `goalkeeper_bodyonly_*` packs if we ever want persona keepers — out of scope now.

---

## Missing-assets summary (priority order)

1. **Knee celebrations → persona (`KneeSlide` / `KneeRise` / `KneeJump`).** Most visible break — wrong face on every
   goal. Needs a new body-only regen pack (none exists yet).
2. **Rear-view shot pose (`shot_back` body-only).** Persona shots now always use the front `shot_front`; a player
   shooting away from camera plays the front body. Needs a `shot_back` regen pack for a true rear kick.
3. **`header` / `receive` / `intercept` / `turn` / `stop_brake` regen.** Still v4 art (playable sandbox only);
   regenerate body-only to match the new style.

Everything above **composites the persona head correctly except the three knee celebrations** (baked). So "how it looks
now" is: new regen bodies for the **full locomotion family (front + side + back)** and the front shot, old-but-persona-headed
bodies for the remaining actions, and a generic face only during the knee-slide celebration.
