import { PersonaEditor } from '@/components/aligner/persona-editor';

export const metadata = {
  title: 'Persona Editor — Hat-trick',
};

/** Dev tool: tune the persona boneco's head placement/size per anim, rendered 1:1 with the match. */
export default function PersonaEditorPage() {
  return <PersonaEditor />;
}
