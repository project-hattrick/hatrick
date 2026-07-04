'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Pencil, Wallet, Trophy, Coins, Package, Percent } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { buttonVariants } from '@/components/ui/button';
import { formatThousands, shortAddress } from '@/lib/format';
import { selfProfile } from '@/config/duelists.config';
import { useAuth } from '@/services/queries/use-auth';

/** Profile header + stat row, driven by the real wallet session (useAuth). */
export function ProfileIdentity() {
  const { isAuthenticated, user } = useAuth();

  const wallet = user?.walletAddress ?? null;
  const displayName =
    user?.displayName ?? (wallet ? shortAddress(wallet) : 'Guest');
  const handle = wallet ? `@${shortAddress(wallet)}` : 'Not signed in';
  const coins =
    isAuthenticated && user ? formatThousands(Number(user.balance)) : '—';

  const stats = [
    { icon: Trophy, label: 'Points', value: '1,240' },
    { icon: Coins, label: 'Coins', value: coins },
    { icon: Package, label: 'Packs', value: '12' },
    { icon: Percent, label: 'Win rate', value: '58%' },
  ];

  return (
    <>
      <GlassPanel
        radius="xl"
        tone="surface"
        className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-end overflow-hidden rounded-full bg-gradient-to-b from-surface-3 to-surface-deep ring-1 ring-white/10">
            <Image
              src={selfProfile.portraitSrc}
              alt={displayName}
              width={64}
              height={64}
              className="translate-y-[6%] scale-110 object-contain object-bottom"
              style={{ imageRendering: 'pixelated' }}
            />
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold">{displayName}</span>
            <span className="text-sm text-muted-foreground">{handle}</span>
            <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="size-3.5" />{' '}
              {wallet
                ? `${shortAddress(wallet)} · devnet`
                : 'Connect your wallet to sign in'}
            </span>
          </div>
        </div>
        <Link
          href="/profile/edit"
          className={buttonVariants({ variant: 'outline' })}
        >
          <Pencil className="size-4" /> Edit profile
        </Link>
      </GlassPanel>

      <div className="grid gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <GlassPanel
            key={stat.label}
            radius="lg"
            tone="surface"
            className="flex items-center gap-3 p-4"
          >
            <stat.icon className="size-5 text-neon" />
            <div className="flex flex-col">
              <span className="text-lg font-bold tabular-nums">{stat.value}</span>
              <span className="text-[11px] text-muted-foreground">{stat.label}</span>
            </div>
          </GlassPanel>
        ))}
      </div>
    </>
  );
}
