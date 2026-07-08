import { PersonasMatchEditor } from '@/components/aligner/personas-match-editor';

export const metadata = {
  title: 'Personas Match Editor — Hat-trick',
};

/** Dev tool: the REAL real-gk-personas match (same engine + config) with live-editable frame configs —
 *  what you tune on the right renders on the pitch on the next frame. Export writes configs.ts source. */
export default function PersonasMatchEditorPage() {
  return <PersonasMatchEditor />;
}
