import Link from 'next/link';

import { GlassPanel } from '@/components/common/glass-panel';
import { Sword } from '@/components/common/icons';
import { AppMode } from '@/enums/app-mode.enum';
import { dailyDuel } from '@/config/formation.config';

/** "Duelo do dia" — your squad rating vs today's opponent, with a jump-in CTA. */
export function DailyDuelCard() {
  const total = dailyDuel.you + dailyDuel.opponent;
  const youShare = Math.round((dailyDuel.you / total) * 100);

  return (
    <GlassPanel tone="dark" radius="xl" className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <Sword className="size-5 text-neon" />
        <span className="text-base font-bold">Duelo do dia</span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-mono text-3xl font-bold text-neon tabular-nums">{dailyDuel.you}</span>
          <span className="text-[11px] text-muted-foreground">Você</span>
        </div>
        <span className="pb-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">vs</span>
        <div className="flex flex-col items-end">
          <span className="font-mono text-3xl font-bold tabular-nums">{dailyDuel.opponent}</span>
          <span className="text-[11px] text-muted-foreground">{dailyDuel.opponentHandle}</span>
        </div>
      </div>

      <div className="flex h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-neon" style={{ width: `${youShare}%` }} />
      </div>

      <Link
        href={`/${AppMode.Fantasy}`}
        className="rounded-xl bg-neon py-3 text-center text-sm font-bold text-primary-foreground transition hover:bg-neon-hover"
      >
        Entrar no duelo
      </Link>
    </GlassPanel>
  );
}
