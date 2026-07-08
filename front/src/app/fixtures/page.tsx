'use client';

import Link from 'next/link';
import { Broadcast, CaretRight } from '@/components/common/icons';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { TeamCrest } from '@/components/common/team-crest';
import { buttonVariants } from '@/components/ui/button';
import { useFixtures } from '@/services/queries/use-fixtures';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';

/** Participant name → crest (code + flag) for the mock fixtures. */
const CREST: Record<string, { code: string; flag: string }> = {
  Argentina: { code: 'ARG', flag: '🇦🇷' },
  France: { code: 'FRA', flag: '🇫🇷' },
  Brazil: { code: 'BRA', flag: '🇧🇷' },
  Portugal: { code: 'POR', flag: '🇵🇹' },
  Spain: { code: 'ESP', flag: '🇪🇸' },
  Germany: { code: 'GER', flag: '🇩🇪' },
};

const crestFor = (name: string) => CREST[name] ?? { code: name.slice(0, 3).toUpperCase(), flag: '🏳️' };

const kickoff = (startTime: number) =>
  new Date(startTime * 1000).toLocaleString('en', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

export default function FixturesPage() {
  const { data: fixtures = [], isLoading } = useFixtures();

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold">Fixtures</h1>
          <p className="text-sm text-muted-foreground">Pick a match to watch live and bet.</p>
        </header>

        <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
          <SectionHeader title="World Cup" action={<span className="text-[10px] text-muted-foreground">Group stage</span>} />
          {isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading fixtures…</p>
          ) : (
            <div className="flex flex-col divide-y divide-border/50">
              {fixtures.map((fixture) => {
                const live = fixture.FixtureId === MOCK_FIXTURE_ID;
                const home = crestFor(fixture.Participant1);
                const away = crestFor(fixture.Participant2);
                return (
                  <div key={fixture.FixtureId} className="flex items-center gap-3 px-4 py-3 sm:gap-4">
                    <span className="w-20 text-caption text-muted-foreground sm:w-28">
                      {live ? (
                        <span className="inline-flex items-center gap-1 font-bold text-live">
                          <Broadcast className="size-3.5" /> LIVE
                        </span>
                      ) : (
                        kickoff(fixture.StartTime)
                      )}
                    </span>
                    <div className="flex flex-1 items-center justify-center gap-4">
                      <TeamCrest code={home.code} flag={home.flag} />
                      <span className="text-xs text-muted-foreground">vs</span>
                      <TeamCrest code={away.code} flag={away.flag} />
                    </div>
                    {live ? (
                      <Link href="/" className={buttonVariants({ variant: 'default', size: 'sm' })}>
                        Watch <CaretRight className="size-3.5" />
                      </Link>
                    ) : (
                      <span className="rounded-full border border-border/60 px-3 py-1 text-[11px] text-muted-foreground">
                        Upcoming
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </GlassPanel>
      </div>
    </PageShell>
  );
}
