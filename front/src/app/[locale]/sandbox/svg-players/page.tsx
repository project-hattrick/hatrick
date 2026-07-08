import { SvgPlayerTest } from '@/components/aligner/svg-player-test';

export const metadata = {
  title: 'v5 SVG Player Test — Hat-trick',
};

/** v5 experiment: vectorized (SVG) player bodies, normalized to one size, vs the PNG originals. */
export default function SvgPlayersPage() {
  return (
    <main className="min-h-screen bg-background">
      <SvgPlayerTest />
    </main>
  );
}
