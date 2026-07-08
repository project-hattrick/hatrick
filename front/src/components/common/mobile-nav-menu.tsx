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

/** Secondary destinations exposed only in the mobile drawer (the top bar has no room for them). */
const secondaryLinks = [
  { label: 'Fixtures', href: '/fixtures' },
  { label: 'Fantasy', href: '/fantasy' },
  { label: 'Market', href: '/fantasy/market' },
  { label: 'Bets', href: '/bets' },
];

/**
 * Hamburger navigation for mobile (< md): the top bar hides its primary links below md, so this
 * exposes them (plus the secondary destinations) in a dropdown. Hidden on md+ where the inline nav shows.
 */
export function MobileNavMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open navigation menu"
        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-surface-2 hover:text-foreground md:hidden"
      >
        <List className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-52">
        {navLinks.map((link) => (
          <DropdownMenuItem key={link.href} render={<Link href={link.href} />}>
            <link.icon className="size-4" /> {link.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {secondaryLinks.map((link) => (
          <DropdownMenuItem key={link.href} render={<Link href={link.href} />}>
            {link.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
