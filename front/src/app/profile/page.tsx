import Link from 'next/link';
import { Pencil, Wallet, Trophy, Coins, Package, Percent } from '@/components/common/icons';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { WireBlock } from '@/components/common/wire-block';
import { Avatar } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';

const stats = [
  { icon: Trophy, label: 'Points', value: '1,240' },
  { icon: Coins, label: 'Coins', value: '28.1M' },
  { icon: Package, label: 'Packs', value: '12' },
  { icon: Percent, label: 'Win rate', value: '58%' },
];

export default function ProfilePage() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <GlassPanel radius="xl" tone="surface" className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name="Kaua Miguel" className="size-16" />
            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold">Kaua Miguel</span>
              <span className="text-sm text-muted-foreground">@kauamigueldev</span>
              <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wallet className="size-3.5" /> 7xKp…9fQ2 · devnet
              </span>
            </div>
          </div>
          <Link href="/profile/edit" className={buttonVariants({ variant: 'outline' })}>
            <Pencil className="size-4" /> Edit profile
          </Link>
        </GlassPanel>

        <div className="grid gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <GlassPanel key={stat.label} radius="lg" tone="surface" className="flex items-center gap-3 p-4">
              <stat.icon className="size-5 text-neon" />
              <div className="flex flex-col">
                <span className="text-lg font-bold tabular-nums">{stat.value}</span>
                <span className="text-[11px] text-muted-foreground">{stat.label}</span>
              </div>
            </GlassPanel>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
            <SectionHeader title="Collection" action={<span className="text-[10px] text-muted-foreground">7 players</span>} />
            <div className="grid grid-cols-3 gap-3 p-4 pt-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <WireBlock key={i} label="Player card" className="h-28" />
              ))}
            </div>
          </GlassPanel>

          <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
            <SectionHeader title="Starting XI" action={<Link href="/fantasy" className="text-[10px] text-neon">Manage</Link>} />
            <WireBlock label="Formation pitch · 11 player slots" className="m-4 h-44" />
          </GlassPanel>
        </div>

        <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
          <SectionHeader title="Bet & prediction history" action={<Link href="/bets" className="text-[10px] text-neon">View all</Link>} />
          <div className="flex flex-col gap-2 p-4 pt-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <WireBlock key={i} label="Bet row — market · stake · odds · status" className="h-12" />
            ))}
          </div>
        </GlassPanel>
      </div>
    </PageShell>
  );
}
