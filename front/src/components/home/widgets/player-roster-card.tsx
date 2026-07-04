import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { buttonVariants } from '@/components/ui/button';
import { formatMinute } from '@/lib/format';
import type { SquadPlayer } from '@/config/squad.config';

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-surface-3/50 py-2">
      <span className="text-base font-bold tabular-nums">{value}</span>
      <span className="text-eyebrow text-muted-foreground">{label}</span>
    </div>
  );
}

/** Roster card: number + portrait, identity, three stats and profile / shirt actions. */
export function PlayerRosterCard({ player }: { player: SquadPlayer }) {
  return (
    <GlassPanel tone="surface" radius="xl" className="flex w-72 shrink-0 flex-col overflow-hidden">
      <div className="relative h-44 bg-gradient-to-b from-surface-3 to-surface-1">
        <div className="absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-surface-1/80 to-transparent" />
        <span className="absolute top-3 left-4 z-20 font-talero text-3xl text-neon">{player.number}</span>
        <Image
          src={player.portraitSrc}
          alt={player.name}
          fill
          sizes="288px"
          className="object-contain object-bottom pt-3"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface-2 via-surface-2/60 to-transparent" />
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg leading-tight font-bold">{player.name}</h3>
          <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {player.position}
            <span className="text-muted-foreground/50">·</span>
            <span aria-hidden>{player.flag}</span>
            {player.country}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat value={formatMinute(player.playedTime)} label="Played" />
          <Stat value={player.goals} label="Goals" />
          <Stat value={player.assists} label="Assists" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link href="/fantasy" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1' })}>
            View Profile
            <ArrowUpRight className="size-3.5" />
          </Link>
          <Link href="/store" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1' })}>
            Buy Shirt
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </GlassPanel>
  );
}
