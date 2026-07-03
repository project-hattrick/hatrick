import { SpriteEditor } from '@/components/aligner/sprite-editor';

export const metadata = {
  title: 'Sprite Editor — Hat-trick',
};

/** Dev tool: edit head placement + size for every composited sprite, export the configs. */
export default function SpriteEditorPage() {
  return (
    <main className="min-h-screen bg-background">
      <SpriteEditor />
    </main>
  );
}
