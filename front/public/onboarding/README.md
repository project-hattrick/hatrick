# Intro tour clips (`?onboarding=true`)

Drop the walkthrough videos here. The intro modal (`src/components/intro/`) autoplays one per step, muted + looping. Until a file exists, the step shows a branded neon placeholder — so the tour works before the clips are recorded.

Expected files (MP4, short, silent, loopable):

| Step | Video | Optional poster |
|------|-------|-----------------|
| Welcome | `welcome.mp4` | `welcome-poster.webp` |
| Live mode | `live.mp4` | `live-poster.webp` |
| Fantasy mode | `fantasy-bg.mp4` (background match only) | — |

The **Fantasy** step is a coded animation (real `HoloPlayerCard` + TxLINE lower-third + rising stats); `fantasy-bg.mp4` is just the match footage that plays *behind* it. If it's absent, an animated pitch renders instead.

Tips: keep each clip ≲10s and loopable; the modal renders them `object-cover`, so shoot with the subject centered. Posters are shown while the clip loads.
