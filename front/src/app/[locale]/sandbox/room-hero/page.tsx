import { RoomHeroFigureEditor } from '@/components/aligner/room-hero-figure-editor';

export const metadata = {
  title: 'Room Hero Figure Editor — Hat-trick',
};

/** Dev page: reposition the room "starting soon" header players without touching the landing card. */
export default function RoomHeroPage() {
  return (
    <main className="min-h-screen bg-background">
      <RoomHeroFigureEditor />
    </main>
  );
}
