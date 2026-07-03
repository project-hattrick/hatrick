import Link from 'next/link';
import { Play } from '@/components/common/icons';
import { buttonVariants } from '@/components/ui/button';
import { AppMode } from '@/enums/app-mode.enum';
import { liveMatchCount } from '@/config/home.config';

/** Welcome-back header right below the hero: greeting, live pulse line and the main CTA. */
export function GreetingBanner() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Bom te ver de novo 👋</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          O Mundial tá pegando fogo —{' '}
          <span className="font-semibold text-foreground">{liveMatchCount} jogos rolando agora</span>. Escolhe um e
          começa a palpitar (é de graça).
        </p>
      </div>
      <Link
        href={`/${AppMode.Live}`}
        className={buttonVariants({ size: 'lg', className: 'h-11 shrink-0 gap-2 px-6 text-base font-semibold' })}
      >
        <Play className="size-5" />
        Cair num jogo
      </Link>
    </div>
  );
}
