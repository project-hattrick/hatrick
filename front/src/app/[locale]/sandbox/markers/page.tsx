import { MarkerVariations } from '@/components/aligner/marker-variations';

export const metadata = {
  title: 'Marker Variations — Hatrick',
};

/** Dev page: pick the active-player marker style for the sandbox. */
export default function MarkersPage() {
  return (
    <main className="min-h-screen bg-background">
      <MarkerVariations />
    </main>
  );
}
