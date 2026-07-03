import Link from 'next/link';
import { UserPlus, Users } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { buttonVariants } from '@/components/ui/button';
import { AppMode } from '@/enums/app-mode.enum';

/** Invite card in the live rail: start a watch-together session with friends. */
export function WatchTogetherCard() {
  return (
    <GlassPanel
      tone="surface"
      className="flex flex-1 flex-col justify-center gap-3 border-neon/25 bg-gradient-to-br from-neon/10 to-transparent p-4"
    >
      <div className="flex items-center gap-2">
        <Users className="size-5 text-neon" />
        <span className="text-sm font-bold">Assistir junto</span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Inicie uma sessão e chame a galera pra ver e palpitar em tempo real.
      </p>
      <div className="flex items-center gap-1.5">
        <span className="size-6 rounded-full border-2 border-background bg-gradient-to-br from-slate-500 to-slate-800" />
        <span className="-ml-3 size-6 rounded-full border-2 border-background bg-gradient-to-br from-rose-500/70 to-rose-950" />
        <span className="-ml-3 grid size-6 place-items-center rounded-full border-2 border-dashed border-neon/50 bg-white/5 text-xs font-bold text-neon">
          +
        </span>
        <span className="ml-1 text-[11px] text-muted-foreground">2 amigos online</span>
      </div>
      <Link href={`/${AppMode.Live}`} className={buttonVariants({ className: 'h-9 w-full gap-1.5 font-semibold' })}>
        <UserPlus className="size-4" />
        Iniciar sessão
      </Link>
    </GlassPanel>
  );
}
