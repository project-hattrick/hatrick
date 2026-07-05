import Image from 'next/image';
import { Globe, ShieldCheck, SoccerBall, Trophy, type Icon } from '@/components/common/icons';
import { ModeShowcaseCard } from './widgets/mode-showcase-card';
import { playModes } from '@/config/home.config';
import { HomeModeDialogs } from './home-mode-dialogs';

const footerIcons: { key: string; icon: Icon }[] = [
  { key: 'global', icon: Globe },
  { key: 'competitive', icon: Trophy },
  { key: 'fair-play', icon: ShieldCheck },
  { key: 'football', icon: SoccerBall },
];

/** Full-screen "Two modes" showcase — own stadium backdrop, content constrained to the page width. */
export function ModeShowcaseSection() {
  return (
    <section id="modes" className="relative flex min-h-svh items-center overflow-hidden">
      <div aria-hidden className="absolute inset-0">
        <Image src="/cards/stadium-podium.png" alt="" fill sizes="100vw" className="object-cover opacity-60" />
        <div className="absolute inset-0 bg-overlay/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16 md:py-20">
        <div className="flex items-center gap-5">
          <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
          <h2 className="text-title text-center tracking-[0.3em] uppercase">Two modes. Endless ways to win.</h2>
          <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {playModes.map((mode) => (
            <ModeShowcaseCard key={mode.key} mode={mode} />
          ))}
        </div>

        <div aria-hidden className="flex items-center justify-center divide-x divide-border/60">
          {footerIcons.map(({ key, icon: FooterIcon }) => (
            <span key={key} className="px-6 text-muted-foreground/60 md:px-8">
              <FooterIcon className="size-5" />
            </span>
          ))}
        </div>
      </div>
      <HomeModeDialogs />
    </section>
  );
}
