import { BillboardEditor } from '@/components/aligner/billboard-editor';

export const metadata = {
  title: 'Billboard Editor — Hat-trick',
};

/** Dev tool: place/drag advertiser panels (image + LED) over the real pitch, then export the ratios. */
export default function BillboardEditorPage() {
  return (
    <main className="min-h-screen bg-background">
      <BillboardEditor />
    </main>
  );
}
