import { ShadowEditor } from '@/components/aligner/shadow-editor';

export const metadata = {
  title: 'Shadow Editor — Hatrick',
};

/** Dev tool: tune/add/resize the foot, cast and beam shadows, then export the numbers. */
export default function ShadowEditorPage() {
  return (
    <main className="min-h-screen bg-background">
      <ShadowEditor />
    </main>
  );
}
