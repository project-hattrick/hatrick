import Link from 'next/link';
import { GlassPanel } from '@/components/common/glass-panel';
import { GameController } from '@/components/common/icons';
import { buttonVariants } from '@/components/ui/button';
import { CHECKPOINTS } from '@/game/checkpoints/registry';

/** Lists the engine checkpoints (versioned snapshots) and imports them into the sandbox. */
export function CheckpointsSection() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <h2 className="text-sm font-bold tracking-wider uppercase">Game checkpoints</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {CHECKPOINTS.map((cp) => {
          const name = cp.title.split('—')[0].trim();
          return (
            <GlassPanel key={cp.id} tone="surface" className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-neon/15 text-neon">
                  <GameController className="size-5" />
                </span>
                <span className="rounded-full bg-surface-3/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {cp.version}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold">{cp.title}</h3>
                <p className="text-sm text-muted-foreground">{cp.subtitle}</p>
              </div>

              <span className="text-xs text-muted-foreground">Created {cp.createdAt}</span>

              <Link href={`/sandbox?cp=${cp.id}`} className={buttonVariants({ className: 'mt-1 w-full' })}>
                Import {name}
              </Link>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}
