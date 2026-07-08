import { PlayerAligner } from '@/components/aligner/player-aligner';

export const metadata = {
  title: 'Player Head Aligner — Hat-trick',
};

/** Dev tool: align a separate head onto the headless player body frames at hero scale. */
export default function PlayerHeadsPage() {
  return (
    <main className="min-h-screen bg-background">
      <PlayerAligner />
    </main>
  );
}
