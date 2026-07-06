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
| Persona **front / side** strike | **regen-v1** `shot_front` ✅ | ✅ | side collapses to the front regen body (`sim/shot.ts`) |
| Persona **rear** strike | **regen-v1** `shot_back` ✅ | ✅ back | away-facing shots use the regen rear pose (`ShotBack`) with the back head |
| `power_shot` / `_back` / `side_shot` (v4 strikes) | v4 | ✅ | **only used by non-persona checkpoints now** — personas no longer reach them |
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
| Knee slide | `celebrate_knee_slide` (`KneeSlide`) | **regen-v1** ✅ | ✅ composited |
| Knee rise | `celebrate_knee_rise` (`KneeRise`) | **regen-v1** ✅ | ✅ composited |
| Knee jump | `celebrate_knee_jump` (`KneeJump`) | **regen-v1** ✅ | ✅ composited |

**Resolved:** the knee pack is now body-only regen (`knee_celebration_bodyonly_regen_v1`), overwriting the baked frames
in `public/game/real-gk/`, with per-frame head configs in `OUTFIELD_FRAME_CONFIG`. Personas now keep their head through
the whole slide → rise → jump, and non-persona checkpoints composite the generic head (no more baked face).

---

## 4. Goalkeeper

GK sprites (`gk_*`) are **baked** whole sprites and the renderer never persona-casts the keeper (`!isGk`). This is by
design (one keeper character). Codex has `goalkeeper_bodyonly_*` packs if we ever want persona keepers — out of scope now.

---

## Missing-assets summary (priority order)

1. **`header` / `receive` / `intercept` / `turn` / `stop_brake` regen.** Still v4 art (playable sandbox only);
   regenerate body-only to match the new style. These are the only v4 bodies left in the persona cast.

Everything now **composites the persona head correctly** (no baked faces left in the persona cast). "How it looks now":
new regen bodies for the **full locomotion family (front + side + back)**, **both shots (front + rear)**, and the **knee
celebrations**; old-but-persona-headed v4 bodies only for header / trap / intercept / turn / brake (playable sandbox).
