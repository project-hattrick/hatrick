import { HeroFigureEditor } from '@/components/aligner/hero-figure-editor';

export const metadata = {
  title: 'Hero Figure Editor — Hat-trick',
};

/** Dev page: reposition the pixel-art players on the Argentina vs Brazil match-hero card. */
export default function HeroFiguresPage() {
  return (
    <main className="min-h-screen bg-background">
      <HeroFigureEditor />
    </main>
  );
}
