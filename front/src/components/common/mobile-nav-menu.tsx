'use client';

import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { List } from '@/components/common/icons';
import { navLinks } from '@/config/nav.config';
import { useLocalizedPath } from '@/hooks/use-localized-path';
import { useT } from '@/i18n/i18n-provider';

/** Secondary destinations exposed only in the mobile drawer (the top bar has no room for them). */
const secondaryLinks = [
  { labelKey: 'nav.fixtures', href: '/fixtures' },
  { labelKey: 'nav.fantasy', href: '/fantasy' },
  { labelKey: 'nav.market', href: '/fantasy/market' },
  { labelKey: 'nav.bets', href: '/bets' },
] as const;

/**
 * Hamburger navigation for mobile (< md): the top bar hides its primary links below md, so this
 * exposes them (plus the secondary destinations) in a dropdown. Hidden on md+ where the inline nav shows.
 */
export function MobileNavMenu() {
  const t = useT();
  const localizedPath = useLocalizedPath();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('common.openNavigation')}
        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-surface-2 hover:text-foreground md:hidden"
      >
        <List className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-52">
        {navLinks.map((link) => (
          <DropdownMenuItem key={link.href} render={<Link href={localizedPath(link.href)} />}>
            <link.icon className="size-4" /> {t(link.labelKey)}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {secondaryLinks.map((link) => (
          <DropdownMenuItem key={link.href} render={<Link href={localizedPath(link.href)} />}>
            {t(link.labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
