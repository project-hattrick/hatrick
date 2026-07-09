import { HeroFigureEditor } from '@/components/aligner/hero-figure-editor';

export const metadata = {
  title: 'Hero Figure Editor — Hat-trick',
};

/** Dev page: pick any two teams and reposition their pixel-art players on the match-hero card. */
export default function HeroFiguresPage() {
  return (
    <main className="min-h-screen bg-background">
      <HeroFigureEditor />
    </main>
  );
}
