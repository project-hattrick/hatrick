'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, List } from '@/components/common/icons';
import { navLinks } from '@/config/nav.config';
import { useLocalizedPath } from '@/hooks/use-localized-path';
import { useI18n, useT } from '@/i18n/i18n-provider';
import { localeLabels, locales } from '@/i18n/locales';
import { localizePath } from '@/i18n/path';

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
  const { locale } = useI18n();
  const pathname = usePathname();

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
        <DropdownMenuSeparator />
        {/* Language switch — the top bar hides the standalone switcher below md. */}
        {locales.map((value) => (
          <DropdownMenuItem key={value} render={<Link href={localizePath(pathname, value)} />}>
            <span className={`fi fi-${localeLabels[value].flag} rounded-sm`} />
            <span className="flex-1">{localeLabels[value].label}</span>
            {value === locale ? <Check className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
