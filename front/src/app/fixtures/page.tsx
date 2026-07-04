import Link from 'next/link';
import { Broadcast, CaretRight } from '@/components/common/icons';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { TeamCrest } from '@/components/common/team-crest';
import { buttonVariants } from '@/components/ui/button';

const fixtures = [
  { home: { code: 'ARG', flag: '🇦🇷' }, away: { code: 'FRA', flag: '🇫🇷' }, when: '67’', live: true },
  { home: { code: 'BRA', flag: '🇧🇷' }, away: { code: 'POR', flag: '🇵🇹' }, when: 'Today 20:00', live: false },
  { home: { code: 'ESP', flag: '🇪🇸' }, away: { code: 'GER', flag: '🇩🇪' }, when: 'Tomorrow 16:00', live: false },
];

export default function FixturesPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold">Fixtures</h1>
          <p className="text-sm text-muted-foreground">Pick a match to watch live and bet.</p>
        </header>

        <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
          <SectionHeader title="World Cup" action={<span className="text-[10px] text-muted-foreground">Group stage</span>} />
          <div className="flex flex-col divide-y divide-border/50">
            {fixtures.map((fixture, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <span className="w-24 text-[11px] text-muted-foreground">
                  {fixture.live ? (
                    <span className="inline-flex items-center gap-1 font-bold text-live">
                      <Broadcast className="size-3.5" /> LIVE {fixture.when}
                    </span>
                  ) : (
                    fixture.when
                  )}
                </span>
                <div className="flex flex-1 items-center justify-center gap-4">
                  <TeamCrest code={fixture.home.code} flag={fixture.home.flag} />
                  <span className="text-xs text-muted-foreground">vs</span>
                  <TeamCrest code={fixture.away.code} flag={fixture.away.flag} />
                </div>
                <Link
                  href="/"
                  className={buttonVariants({ variant: fixture.live ? 'default' : 'outline', size: 'sm' })}
                >
                  {fixture.live ? 'Watch' : 'Details'} <CaretRight className="size-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </PageShell>
  );
}
