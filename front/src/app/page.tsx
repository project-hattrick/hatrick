import { ModeCard } from '@/components/common/mode-card';
import { AppMode } from '@/enums';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Hat-trick</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          One platform, two ways to live the 2026 World Cup — a 3D fantasy and a
          live 2D match view, both powered by TxLINE.
        </p>
      </div>
      <div className="flex flex-col gap-6 sm:flex-row">
        <ModeCard
          title="Fantasy"
          description="Open packs, build your XI, and face other users in 3D simulated matches driven by real data."
          href={`/${AppMode.Fantasy}`}
          cta="Play Fantasy"
        />
        <ModeCard
          title="Live"
          description="Follow real matches as a live 2D view and bet in-match — all in one screen."
          href={`/${AppMode.Live}`}
          cta="Watch Live"
        />
      </div>
    </div>
  );
}
