'use client';

import { PersonasMatchEditor } from '@/components/aligner/personas-match-editor';
import { franceAnimsForRoot } from '@/components/aligner/france-match-editor-data';
import { AWAY_TEAM_PACKS, REAL_GK_FRANCE_VS_NL_CONFIG } from '@/game/realgk/config';
import { allFeelOn } from '@/game/realgk/sim/feel';

/** Argentina (home) vs Norway (away) match, both recolored packs, with every feel technique on. The editor
 *  rail mutates the shared FRAME_CONFIGs (head/body geometry), which reflect live on these bonecos. */
const CONFIG = {
  ...REAL_GK_FRANCE_VS_NL_CONFIG,
  personaBodyRoot: AWAY_TEAM_PACKS.argentina.root,
  personaBodyRootAway: AWAY_TEAM_PACKS.norway.root,
  teams: { blue: AWAY_TEAM_PACKS.argentina.brand, red: AWAY_TEAM_PACKS.norway.brand },
  feel: allFeelOn(),
};

// Preview the ACTUAL game bodies: the franca-family anim set (all anims, pre-trimmed frames) pointed at the
// recolored Argentina pack — not the old /game/personas sprites. Head scale matches the franca match (0.82).
const ARGENTINA_ANIMS = franceAnimsForRoot(AWAY_TEAM_PACKS.argentina.root);
const PREVIEW_HEAD_SCALE = REAL_GK_FRANCE_VS_NL_CONFIG.personaHeadScale ?? 0.82;

export function ArgentinaVsNorwayBonecoEditor() {
  return (
    <PersonasMatchEditor
      config={CONFIG}
      title="Argentina vs Norway — boneco editor"
      hudTag="argentina-vs-norway"
      initialCrt={false}
      anims={ARGENTINA_ANIMS}
      previewHeadScale={PREVIEW_HEAD_SCALE}
    />
  );
}
